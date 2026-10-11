import mongoose from "mongoose";
import connectDB from "../db/db.js";
import Booking from "../models/booking.model.js";
import {
  MEETING_STATUS,
  buildMeetingUrl,
  buildRoomName,
  extractTokenFromMeetingUrl,
  generateMeetingToken,
  isJitsiMeetingUrl,
} from "../services/meeting.service.js";

// One-off, idempotent migration for bookings created before the Jitsi rollout.
//
// Older bookings were saved with a dummy link such as
// `http://localhost:8000/demo-class/<token>`. This script rewrites any such
// record to the real Jitsi room URL, reusing the existing token (so the room
// identity is preserved) and saving the explicit room name. Bookings that
// already point at the configured Jitsi deployment are left untouched.
//
// Usage:
//   npm run migrate:meetings                          # apply the migration
//   node -r dotenv/config src/scripts/migrateMeetingLinks.js --dry-run  # preview

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const dryRun =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

const resolveToken = (booking) => {
  if (typeof booking.meetingToken === "string" && TOKEN_PATTERN.test(booking.meetingToken)) {
    return booking.meetingToken;
  }

  const extracted = extractTokenFromMeetingUrl(booking.meetingLink);
  if (typeof extracted === "string" && extracted.length > 0) {
    return extracted;
  }

  return generateMeetingToken();
};

const migrate = async () => {
  const bookings = await Booking.find({
    $or: [
      { meetingStatus: MEETING_STATUS.DEMO_READY },
      { meetingLink: { $ne: null } },
    ],
  });

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for (const booking of bookings) {
    scanned += 1;

    const token = resolveToken(booking);
    const expectedRoomName = buildRoomName(token);
    const alreadyJitsi = isJitsiMeetingUrl(booking.meetingLink);

    if (alreadyJitsi && booking.meetingRoomName === expectedRoomName) {
      skipped += 1;
      continue;
    }

    console.log(
      `${dryRun ? "[dry-run] " : ""}Upgrading booking ${booking._id}: ` +
        `${booking.meetingLink || "(no link)"} -> ${buildMeetingUrl(token)}`
    );

    if (!dryRun) {
      booking.meetingToken = token;
      booking.meetingRoomName = expectedRoomName;
      booking.meetingLink = buildMeetingUrl(token);

      if (booking.meetingStatus !== MEETING_STATUS.DEMO_READY) {
        booking.meetingStatus = MEETING_STATUS.DEMO_READY;
      }

      await booking.save();
    }

    updated += 1;
  }

  console.log(
    `Migration ${dryRun ? "(dry-run) " : ""}complete. ` +
      `Scanned: ${scanned}, Updated: ${updated}, Skipped: ${skipped}`
  );
};

const run = async () => {
  await connectDB();

  try {
    await migrate();
  } catch (error) {
    console.error("Meeting link migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
