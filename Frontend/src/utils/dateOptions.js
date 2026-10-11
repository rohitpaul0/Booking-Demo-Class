import { DISPLAY_TIME_ZONE } from "./timezone.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 7;

// The backend exposes no "list available dates" endpoint, so this is purely a
// UI calendar window: it generates selectable days, NOT a statement that the
// backend has availability on them. Real availability is only known once we
// fetch slots for a chosen date.
//
// Dates are built in the display time zone so each YYYY-MM-DD key matches the
// calendar day the backend will interpret.
const getTodayInZone = (timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
};

const toDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Selectable calendar days for the picker, starting tomorrow. Starting from
 * tomorrow avoids surfacing the current day's already-past times, which the
 * backend does not filter out.
 */
export const getSelectableDates = ({
  days = DEFAULT_DAYS,
  timeZone = DISPLAY_TIME_ZONE,
} = {}) => {
  const { year, month, day } = getTodayInZone(timeZone);

  // Anchor at 06:00 UTC so a +05:30 zone still lands on the same local day.
  const anchor = Date.UTC(year, month - 1, day, 6);

  const format = (date, options) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(date);

  const options = [];

  for (let offset = 1; offset <= days; offset += 1) {
    const date = new Date(anchor + offset * MS_PER_DAY);

    options.push({
      date: toDateKey(date),
      weekday: format(date, { weekday: "short" }),
      day: format(date, { day: "2-digit" }),
      month: format(date, { month: "short" }),
      fullLabel: format(date, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
  }

  return options;
};
