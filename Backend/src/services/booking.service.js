import mongoose from "mongoose";
import Mentor from "../models/mentor.model.js";
import Booking from "../models/booking.model.js";
import BookingLock from "../models/bookingLock.model.js";
import {
  TRIAL_CLASS_DURATION_MINUTES,
  BLOCKING_BOOKING_STATUSES,
  MAX_DAILY_CLASSES_PER_MENTOR,
} from "../constant.js";
import {
  isValidTimeZone,
  parseExplicitUtcInstant,
  formatDateInZone,
  formatDateTimeInZone,
  getZonedDayRangeUtc,
} from "../utils/timezone.js";
import { intervalOverlaps } from "../utils/availability.js";
import ApiError from "../utils/ApiError.js";
import { createDemoMeeting } from "./meeting.service.js";
import { sendBookingNotifications } from "./email.service.js";

const MINUTE_MS = 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRequest = (payload = {}) => {
  const {
    parentName,
    parentEmail,
    studentName,
    startTime,
    parentTimeZone,
  } = payload;

  if (!parentName || typeof parentName !== "string" || parentName.trim() === "") {
    throw new ApiError(400, "parentName is required");
  }

  if (
    !parentEmail ||
    typeof parentEmail !== "string" ||
    parentEmail.trim() === ""
  ) {
    throw new ApiError(400, "parentEmail is required");
  }

  if (!EMAIL_REGEX.test(parentEmail.trim())) {
    throw new ApiError(400, "parentEmail must be a valid email address");
  }

  if (
    !studentName ||
    typeof studentName !== "string" ||
    studentName.trim() === ""
  ) {
    throw new ApiError(400, "studentName is required");
  }

  if (!isValidTimeZone(parentTimeZone)) {
    throw new ApiError(
      400,
      "parentTimeZone must be a valid IANA time-zone identifier"
    );
  }

  const start = parseExplicitUtcInstant(startTime);

  return {
    parentName: parentName.trim(),
    parentEmail: parentEmail.trim().toLowerCase(),
    studentName: studentName.trim(),
    parentTimeZone,
    startTime: start,
  };
};

export const createBooking = async (payload) => {
  const {
    parentName,
    parentEmail,
    studentName,
    parentTimeZone,
    startTime,
  } = validateRequest(payload);

  const startMs = startTime.getTime();
  const endMs = startMs + TRIAL_CLASS_DURATION_MINUTES * MINUTE_MS;
  const endTime = new Date(endMs);

  const session = await mongoose.startSession();

  try {
    let saved;
    let assignedMentor;

    await session.withTransaction(async () => {
      const mentors = await Mentor.find({ isActive: true }).lean();

      const availabilityEligible = mentors.filter((mentor) =>
        mentor.availableSlots.some((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          const slotEnd = new Date(slot.endTime).getTime();

          return slotStart <= startMs && endMs <= slotEnd;
        })
      );

      if (availabilityEligible.length === 0) {
        throw new ApiError(
          422,
          "No eligible mentor is available for the requested time"
        );
      }

      const eligibleMentorIds = availabilityEligible.map(
        (mentor) => mentor._id
      );

      // Any blocking booking that could fall on the requested instant's
      // local calendar day (in a mentor's own zone) lies within +/- 24h.
      const dayWindowStart = new Date(startMs - 24 * 60 * MINUTE_MS);
      const dayWindowEnd = new Date(startMs + 24 * 60 * MINUTE_MS);

      const nearbyBookings = await Booking.find({
        mentor: { $in: eligibleMentorIds },
        status: { $in: BLOCKING_BOOKING_STATUSES },
        startTime: { $gte: dayWindowStart, $lt: dayWindowEnd },
      }).lean();

      const bookingsByMentor = new Map();

      for (const booking of nearbyBookings) {
        const mentorId = String(booking.mentor);

        if (!bookingsByMentor.has(mentorId)) {
          bookingsByMentor.set(mentorId, []);
        }

        bookingsByMentor.get(mentorId).push(booking);
      }

      const countMentorDayBookings = (mentor) => {
        const mentorDate = formatDateInZone(startTime, mentor.timeZone);
        const { start: dayStart, end: dayEnd } = getZonedDayRangeUtc(
          mentorDate,
          mentor.timeZone
        );
        const dayStartMs = dayStart.getTime();
        const dayEndMs = dayEnd.getTime();

        return (bookingsByMentor.get(String(mentor._id)) || []).filter(
          (booking) => {
            const bookedAt = new Date(booking.startTime).getTime();
            return bookedAt >= dayStartMs && bookedAt < dayEndMs;
          }
        ).length;
      };

      const dayCountByMentor = new Map(
        availabilityEligible.map((mentor) => [
          String(mentor._id),
          countMentorDayBookings(mentor),
        ])
      );

      const noConflict = availabilityEligible.filter((mentor) => {
        const mentorBookings =
          bookingsByMentor.get(String(mentor._id)) || [];

        const hasConflict = mentorBookings.some((booking) =>
          intervalOverlaps(
            startMs,
            endMs,
            new Date(booking.startTime).getTime(),
            new Date(booking.endTime).getTime()
          )
        );

        return !hasConflict;
      });

      if (noConflict.length === 0) {
        throw new ApiError(
          409,
          "The requested time is no longer available"
        );
      }

      const underDailyLimit = noConflict.filter(
        (mentor) =>
          (dayCountByMentor.get(String(mentor._id)) || 0) <
          MAX_DAILY_CLASSES_PER_MENTOR
      );

      if (underDailyLimit.length === 0) {
        throw new ApiError(
          409,
          `No mentor is available for the requested time: every available mentor has reached the limit of ${MAX_DAILY_CLASSES_PER_MENTOR} demo classes for this day`
        );
      }

      // Prefer the mentor with the fewest classes on that same local day.
      const chosen = [...underDailyLimit].sort((a, b) => {
        const aCount = dayCountByMentor.get(String(a._id)) || 0;
        const bCount = dayCountByMentor.get(String(b._id)) || 0;

        if (aCount !== bCount) {
          return aCount - bCount;
        }

        return a.email.localeCompare(b.email);
      })[0];

      await BookingLock.updateOne(
        { _id: chosen._id },
        { $set: { updatedAt: new Date() } },
        { upsert: true, session }
      );

      const stillBlocked = await Booking.countDocuments({
        mentor: chosen._id,
        status: { $in: BLOCKING_BOOKING_STATUSES },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      }).session(session);

      if (stillBlocked > 0) {
        throw new ApiError(
          409,
          "The requested time is no longer available"
        );
      }

      const [booking] = await Booking.create(
        [
          {
            parentName,
            parentEmail,
            parentTimeZone,
            studentName,
            mentor: chosen._id,
            startTime,
            endTime,
            status: "pending",
            meetingStatus: "not_created",
            meetingToken: null,
            meetingLink: null,
          },
        ],
        { session }
      );

      saved = booking;
      assignedMentor = chosen;
    });

    return { booking: saved, mentor: assignedMentor };
  } finally {
    await session.endSession();
  }
};

export const confirmBooking = async (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(404, "Booking not found");
  }

  let booking = await Booking.findById(bookingId).populate("mentor");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(409, "A cancelled booking cannot be confirmed");
  }

  if (!booking.mentor) {
    throw new ApiError(
      409,
      "Booking has no assigned mentor and cannot be confirmed"
    );
  }

  if (booking.status === "pending") {
    const transitioned = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "pending" },
      { $set: { status: "confirmed" } },
      { returnDocument: "after" }
    ).populate("mentor");

    booking =
      transitioned || (await Booking.findById(bookingId).populate("mentor"));
  }

  const { booking: withMeeting } = await createDemoMeeting(booking);

  let notifications = null;

  try {
    notifications = await sendBookingNotifications(withMeeting._id);
  } catch (error) {
    console.error(
      "Notifications after booking confirmation failed:",
      error.message
    );
  }

  const finalized = await Booking.findById(withMeeting._id).populate("mentor");

  return { booking: finalized, mentor: finalized.mentor, notifications };
};

export const buildBookingResponse = (booking, mentor) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const parentTimeZone = booking.parentTimeZone;
  const mentorTimeZone = mentor.timeZone;

  return {
    bookingId: booking._id.toString(),
    status: booking.status,
    parent: {
      name: booking.parentName,
      email: booking.parentEmail,
    },
    student: {
      name: booking.studentName,
    },
    mentor: {
      id: mentor._id.toString(),
      name: mentor.name,
      email: mentor.email,
      timeZone: mentorTimeZone,
    },
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    parentLocal: {
      timeZone: parentTimeZone,
      startTimeLocal: formatDateTimeInZone(start, parentTimeZone),
      endTimeLocal: formatDateTimeInZone(end, parentTimeZone),
    },
    mentorLocal: {
      timeZone: mentorTimeZone,
      startTimeLocal: formatDateTimeInZone(start, mentorTimeZone),
      endTimeLocal: formatDateTimeInZone(end, mentorTimeZone),
    },
    meeting: {
      status: booking.meetingStatus,
      link: booking.meetingLink ?? null,
      created: booking.meetingStatus === "demo_ready",
      message:
        booking.meetingStatus === "demo_ready"
          ? "Demo meeting link is ready. No real video call is available yet."
          : booking.meetingStatus === "failed"
          ? "Meeting link generation failed."
          : "Meeting link is created once the booking is confirmed.",
    },
  };
};