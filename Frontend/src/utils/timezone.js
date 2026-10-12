// The backend localises slot times into the time zone sent as the `timeZone`
// query parameter, and interprets the requested `date` as a calendar day in
// that same zone (Backend/src/services/slot.service.js). When the parameter is
// omitted the backend falls back to its own TIME_ZONE, which is "Asia/Kolkata".
//
// The parent's zone is detected from the browser and can be overridden in the
// booking form. FALLBACK_TIME_ZONE is used only when detection is unavailable.
export const FALLBACK_TIME_ZONE = "Asia/Kolkata";

const isValidTimeZone = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

// Detect the visitor's IANA time zone from the browser/OS. Falls back to
// FALLBACK_TIME_ZONE when the environment reports nothing usable.
export const detectTimeZone = () => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (isValidTimeZone(detected)) {
      return detected;
    }
  } catch {
    // Ignore and use the fallback below.
  }

  return FALLBACK_TIME_ZONE;
};

// A short list of zones relevant to this product (US and UK parents, Indian
// mentors) for manual selection when the detected zone is not the desired one.
export const COMMON_TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Kolkata",
];

// Options for the time-zone selector, always including the current value so a
// detected zone outside COMMON_TIME_ZONES still appears and stays selected.
export const getTimeZoneOptions = (currentTimeZone) => {
  const options = new Set(COMMON_TIME_ZONES);

  if (isValidTimeZone(currentTimeZone)) {
    options.add(currentTimeZone);
  }

  return Array.from(options);
};

// Build a human-readable label such as "Asia/Kolkata (GMT+5:30)".
// The offset is computed by Intl for the given instant (the class date), never
// hardcoded. Pass the class start time so DST-observing zones show the offset
// that actually applies on that date; defaults to now when no instant is known.
export const getTimeZoneLabel = (timeZone = FALLBACK_TIME_ZONE, date = new Date()) => {
  if (!timeZone || typeof timeZone !== "string") {
    return FALLBACK_TIME_ZONE;
  }

  const instant = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(instant.getTime())) {
    return timeZone;
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(instant);

    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset ? `${timeZone} (${offset})` : timeZone;
  } catch {
    return timeZone;
  }
};
