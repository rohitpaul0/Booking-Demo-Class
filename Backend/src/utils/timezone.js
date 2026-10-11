import ApiError from "./ApiError.js";

export const TIME_ZONE = "Asia/Kolkata";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})$/;

export const isValidDateString = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
};

export const isValidTimeZone = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
};

export const parseExplicitUtcInstant = (value) => {
  if (typeof value !== "string" || !INSTANT_PATTERN.test(value.trim())) {
    throw new ApiError(
      400,
      "startTime must be an unambiguous UTC date-time with Z or an explicit offset"
    );
  }

  const timestamp = Date.parse(value.trim());

  if (Number.isNaN(timestamp)) {
    throw new ApiError(
      400,
      "startTime must be an unambiguous UTC date-time with Z or an explicit offset"
    );
  }

  return new Date(timestamp);
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const values = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
};

const wallClockToUtc = (year, month, day, hours, minutes, timeZone) => {
  const guess = Date.UTC(year, month - 1, day, hours, minutes);

  const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  let result = guess - firstOffset;

  const secondOffset = getTimeZoneOffsetMs(new Date(result), timeZone);

  if (secondOffset !== firstOffset) {
    result = guess - secondOffset;
  }

  return result;
};

export const zonedDateTimeToUtc = (
  dateString,
  timeString,
  timeZone = TIME_ZONE
) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);

  return new Date(wallClockToUtc(year, month, day, hour, minute, timeZone));
};

export const getZonedDayRangeUtc = (dateString, timeZone = TIME_ZONE) => {
  const [year, month, day] = dateString.split("-").map(Number);

  const start = new Date(
    wallClockToUtc(year, month, day, 0, 0, timeZone)
  );
  const end = new Date(
    wallClockToUtc(year, month, day + 1, 0, 0, timeZone)
  );

  return { start, end };
};

export const formatTimeInZone = (date, timeZone = TIME_ZONE) => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatDateInZone = (date, timeZone = TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
};

export const formatDateTimeInZone = (date, timeZone = TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const hour = values.hour === "24" ? "00" : values.hour;

  return `${values.year}-${values.month}-${values.day} ${hour}:${values.minute}`;
};