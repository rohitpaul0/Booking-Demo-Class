import Mentor from "../models/mentor.model.js";
import Booking from "../models/booking.model.js";
import {
  TRIAL_CLASS_DURATION_MINUTES,
  SLOT_STEP_MINUTES,
  BLOCKING_BOOKING_STATUSES,
  MAX_DAILY_CLASSES_PER_MENTOR,
} from "../constant.js";
import {
  TIME_ZONE,
  getZonedDayRangeUtc,
  formatDateInZone,
  formatTimeInZone,
} from "../utils/timezone.js";
import { intervalOverlaps } from "../utils/availability.js";

const MINUTE_MS = 60 * 1000;

export const getAvailableSlots = async (dateString, timeZone = TIME_ZONE) => {
  const displayTimeZone = timeZone || TIME_ZONE;

  const { start: dayStart, end: dayEnd } = getZonedDayRangeUtc(
    dateString,
    displayTimeZone
  );

  const durationMs = TRIAL_CLASS_DURATION_MINUTES * MINUTE_MS;
  const stepMs = SLOT_STEP_MINUTES * MINUTE_MS;

  const mentors = await Mentor.find({ isActive: true }).lean();

  // Fetch a wider window so bookings on the adjacent local day (in a mentor's
  // own zone) are still counted towards that mentor's daily limit.
  const windowStart = new Date(dayStart.getTime() - 24 * 60 * MINUTE_MS);
  const windowEnd = new Date(dayEnd.getTime() + 24 * 60 * MINUTE_MS);

  const bookings = await Booking.find({
    mentor: { $ne: null },
    status: { $in: BLOCKING_BOOKING_STATUSES },
    startTime: { $lt: windowEnd },
    endTime: { $gt: windowStart },
  }).lean();

  const mentorById = new Map(mentors.map((mentor) => [String(mentor._id), mentor]));
  const bookingsByMentor = new Map();
  const dayCountsByMentor = new Map();

  for (const booking of bookings) {
    const mentorId = String(booking.mentor);

    if (!bookingsByMentor.has(mentorId)) {
      bookingsByMentor.set(mentorId, []);
    }

    bookingsByMentor.get(mentorId).push(booking);

    const mentor = mentorById.get(mentorId);

    if (!mentor) {
      continue;
    }

    const dayKey = formatDateInZone(
      new Date(booking.startTime),
      mentor.timeZone
    );

    if (!dayCountsByMentor.has(mentorId)) {
      dayCountsByMentor.set(mentorId, new Map());
    }

    const dayCounts = dayCountsByMentor.get(mentorId);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
  }

  const slots = [];
  const dayEndMs = dayEnd.getTime();

  for (
    let startMs = dayStart.getTime();
    startMs + durationMs <= dayEndMs;
    startMs += stepMs
  ) {
    const endMs = startMs + durationMs;
    const startDate = new Date(startMs);
    let availableMentors = 0;
    // Zones of the mentors who can actually take this slot. Different mentors
    // may observe different zones (and DST states), so this is kept per slot.
    const mentorTimeZones = new Set();

    for (const mentor of mentors) {
      const mentorId = String(mentor._id);

      const fitsAvailability = mentor.availableSlots.some((slot) => {
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();

        return slotStart <= startMs && endMs <= slotEnd;
      });

      if (!fitsAvailability) {
        continue;
      }

      const mentorBookings = bookingsByMentor.get(mentorId) || [];
      const hasConflict = mentorBookings.some((booking) =>
        intervalOverlaps(
          startMs,
          endMs,
          new Date(booking.startTime).getTime(),
          new Date(booking.endTime).getTime()
        )
      );

      if (hasConflict) {
        continue;
      }

      const slotDayKey = formatDateInZone(startDate, mentor.timeZone);
      const dayCount =
        (dayCountsByMentor.get(mentorId) || new Map()).get(slotDayKey) || 0;

      if (dayCount >= MAX_DAILY_CLASSES_PER_MENTOR) {
        continue;
      }

      availableMentors += 1;
      mentorTimeZones.add(mentor.timeZone || TIME_ZONE);
    }

    if (availableMentors > 0) {
      const endDate = new Date(endMs);

      slots.push({
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        startTimeLocal: formatTimeInZone(startDate, displayTimeZone),
        endTimeLocal: formatTimeInZone(endDate, displayTimeZone),
        availableMentors,
        mentorTimeZones: Array.from(mentorTimeZones).sort(),
      });
    }
  }

  return {
    date: dateString,
    timeZone: displayTimeZone,
    durationMinutes: TRIAL_CLASS_DURATION_MINUTES,
    totalSlots: slots.length,
    slots,
  };
};
