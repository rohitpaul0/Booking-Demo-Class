import crypto from "node:crypto";
import ApiError from "../utils/ApiError.js";

export const MEETING_BASE_URL =
  process.env.APP_BASE_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

export const MEETING_STATUS = Object.freeze({
  NOT_CREATED: "not_created",
  DEMO_READY: "demo_ready",
  FAILED: "failed",
});

const DEMO_CLASS_PATH = "demo-class";

export const generateMeetingToken = () =>
  crypto.randomBytes(32).toString("hex");

export const buildDemoMeetingUrl = (token) =>
  `${MEETING_BASE_URL}/${DEMO_CLASS_PATH}/${token}`;

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

  if (
    booking.meetingStatus === MEETING_STATUS.DEMO_READY &&
    booking.meetingLink
  ) {
    return { generated: false, booking };
  }

  const token = generateMeetingToken();
  booking.meetingToken = token;
  booking.meetingLink = buildDemoMeetingUrl(token);

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