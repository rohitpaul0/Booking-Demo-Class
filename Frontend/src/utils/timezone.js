// The backend localises slot times into the time zone sent as the `timeZone`
// query parameter, and interprets the requested `date` as a calendar day in
// that same zone (Backend/src/services/slot.service.js). When the parameter is
// omitted the backend falls back to its own TIME_ZONE, which is "Asia/Kolkata".
//
// We send this value explicitly so the displayed times and the meaning of the
// selected date always refer to the SAME zone.
//
// IMPORTANT: This is the project's fixed demo time zone. It is NOT the
// visitor's browser time zone, and it is not yet a per-parent selection —
// choosing a parent-specific zone needs a parent time-zone field (not built).
export const DISPLAY_TIME_ZONE = "Asia/Kolkata";

// Build a human-readable label such as "Asia/Kolkata (GMT+5:30)".
// The offset is computed by Intl at the current instant, never hardcoded.
export const getTimeZoneLabel = (timeZone = DISPLAY_TIME_ZONE) => {
  if (!timeZone || typeof timeZone !== "string") {
    return DISPLAY_TIME_ZONE;
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(new Date());

    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset ? `${timeZone} (${offset})` : timeZone;
  } catch {
    return timeZone;
  }
};
