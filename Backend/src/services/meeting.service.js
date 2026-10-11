import crypto from "node:crypto";
import ApiError from "../utils/ApiError.js";

// Jitsi Meet deployment used to host each booking's demo class room.
//
// Defaults to the public service (https://meet.jit.si). If the project has its
// own Jitsi deployment, set JITSI_BASE_URL to it instead.
//
// IMPORTANT: public Jitsi rooms are NOT private or access-controlled by default.
// Anyone who knows (or guesses) the room name can join. The generated room name
// is random and non-guessable, and should be treated as a secret, but for truly
// confidential meetings self-host Jitsi and/or enable authentication, then point
// JITSI_BASE_URL at that deployment.
export const JITSI_BASE_URL = (
  process.env.JITSI_BASE_URL || "https://meet.jit.si"
).replace(/\/+$/, "");

// Prefix keeps this app's rooms grouped and makes accidental collisions with
// unrelated public rooms unlikely.
const ROOM_PREFIX = "BookingDemoClass-";

export const MEETING_STATUS = Object.freeze({
  NOT_CREATED: "not_created",
  DEMO_READY: "demo_ready",
  FAILED: "failed",
});

// 32 random bytes -> 64 hex characters (~256 bits of entropy): unique and
// non-guessable. This is stored as the booking's meetingToken.
export const generateMeetingToken = () =>
  crypto.randomBytes(32).toString("hex");

export const buildRoomName = (token) => `${ROOM_PREFIX}${token}`;

export const buildMeetingUrl = (token) =>
  `${JITSI_BASE_URL}/${buildRoomName(token)}`;

export const extractTokenFromMeetingUrl = (url) => {
  if (typeof url !== "string" || url.trim() === "") return null;
  try {
    const parsed = new URL(url);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) return null;
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    if (typeof last !== "string") return null;
    if (last.startsWith(ROOM_PREFIX)) return last.slice(ROOM_PREFIX.length);
    return last;
  } catch {
    return null;
  }
};

// Accepts only well-formed http(s) URLs so a missing or malformed saved link is
// never rendered as a broken href or returned as if it were usable.
export const isValidMeetingUrl = (url) => {
  if (typeof url !== "string" || url.trim() === "") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// A URL is only a usable meeting link when it points at this deployment's Jitsi
// base (e.g. https://meet.jit.si). Legacy /demo-class/<id> URLs are rejected so
// they are never surfaced as if they were real rooms.
export const isJitsiMeetingUrl = (url) =>
  isValidMeetingUrl(url) && url.startsWith(`${JITSI_BASE_URL}/`);

export const isEligibleForDemoMeeting = (booking) => {
  return (
    booking &&
    booking.status === "confirmed" &&
    booking.mentor != null &&
    booking.mentor !== undefined
  );
};

export const createDemoMeeting = async (booking) => {
  if (!isEligibleForDemoMeeting(booking)) {
    throw new ApiError(
      409,
      "Booking must be confirmed and assigned a mentor to create a demo meeting link"
    );
  }

  // Idempotent: an already-saved Jitsi URL is reused as-is (never a new room).
  // The saved room name is backfilled when missing so it stays in sync.
  const currentUrl = booking.meetingLink;
  if (
    booking.meetingStatus === MEETING_STATUS.DEMO_READY &&
    isJitsiMeetingUrl(currentUrl)
  ) {
    const token =
      booking.meetingToken || extractTokenFromMeetingUrl(currentUrl);
    if (token && booking.meetingRoomName !== buildRoomName(token)) {
      booking.meetingToken = token;
      booking.meetingRoomName = buildRoomName(token);
      await booking.save();
    }
    return { generated: false, booking };
  }
  // If a saved valid non-Jitsi URL exists (e.g., legacy /demo-class/*), replace
  // it with a Jitsi URL, reusing its token so the room identity is preserved.
  if (
    booking.meetingStatus === MEETING_STATUS.DEMO_READY &&
    isValidMeetingUrl(currentUrl)
  ) {
    const tokenFromOld = booking.meetingToken || extractTokenFromMeetingUrl(currentUrl);
    const token = tokenFromOld && tokenFromOld.length > 0 ? tokenFromOld : generateMeetingToken();
    booking.meetingToken = token;
    booking.meetingRoomName = buildRoomName(token);
    booking.meetingLink = buildMeetingUrl(token);
    try {
      await booking.save();
      return { generated: false, booking };
    } catch (persistError) {}
  }

  const token = generateMeetingToken();
  booking.meetingToken = token;
  booking.meetingRoomName = buildRoomName(token);
  booking.meetingLink = buildMeetingUrl(token);

  try {
    booking.meetingStatus = MEETING_STATUS.DEMO_READY;

    await booking.save();

    return { generated: true, booking };
  } catch (error) {
    booking.meetingStatus = MEETING_STATUS.FAILED;

    try {
      await booking.save();
    } catch (persistError) {
      // Best effort only; the original error is rethrown below.
    }

    throw error;
  }
};
