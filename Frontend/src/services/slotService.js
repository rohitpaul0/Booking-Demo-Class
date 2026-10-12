import api from "./api.js";

// Translate an Axios/HTTP failure into a message that is safe to show in the UI.
// Never leaks stack traces or database details from the backend.
const toFriendlyMessage = (error) => {
  if (error?.response) {
    const serverMessage = error.response.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim() !== "") {
      return serverMessage;
    }
    return `The slot service responded with an error (status ${error.response.status}).`;
  }

  if (error?.code === "ECONNABORTED") {
    return "Loading available times took too long. Please try again.";
  }

  return "Could not reach the slot service. Check that the backend is running and try again.";
};

/**
 * Fetch available demo-class slots for one calendar date.
 *
 * Backend contract (see Backend/src/routes/slot.routes.js and
 * Backend/src/controllers/slot.controller.js):
 *   GET {API_BASE_URL}/slots?date=YYYY-MM-DD&timeZone=<IANA>
 *   -> { success: true, data: {
 *          date, timeZone, durationMinutes, totalSlots,
 *          slots: [{ startTime, endTime, startTimeLocal, endTimeLocal,
 *                    availableMentors, mentorTimeZones }]
 *        } }
 *
 * - `date` is interpreted by the backend as a calendar day IN `timeZone`.
 * - `startTime`/`endTime` are unambiguous UTC instants (ISO 8601 with "Z").
 * - `startTimeLocal`/`endTimeLocal` are already localised to `timeZone`.
 * - `mentorTimeZones` lists the zones of the mentors offering that slot.
 * - Only available slots are returned; busy slots are simply omitted.
 */
export const getAvailableSlots = async ({ date, timeZone }) => {
  let response;

  try {
    response = await api.get("/slots", { params: { date, timeZone } });
  } catch (error) {
    throw new Error(toFriendlyMessage(error));
  }

  const payload = response?.data;

  if (!payload || payload.success !== true || !payload.data) {
    throw new Error("Received an unexpected response from the slot service.");
  }

  const data = payload.data;
  const rawSlots = Array.isArray(data.slots) ? data.slots : [];

  const slots = rawSlots
    // Defensive: only surface times the backend confirms as available.
    .filter((slot) => Number(slot?.availableMentors) > 0)
    .map((slot) => ({
      // `startTime` is unique per slot and timezone-safe; keep it as the id and
      // for the upcoming booking submission. No date/time conversion here.
      id: slot.startTime,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startTimeLocal: slot.startTimeLocal,
      endTimeLocal: slot.endTimeLocal,
      availableMentors: slot.availableMentors,
      mentorTimeZones: Array.isArray(slot.mentorTimeZones) ? slot.mentorTimeZones : [],
    }));

  return {
    date: data.date,
    timeZone: data.timeZone,
    durationMinutes: data.durationMinutes,
    slots,
  };
};
