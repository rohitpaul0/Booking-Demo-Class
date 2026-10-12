import test from "node:test";
import assert from "node:assert/strict";
import {
  zonedDateTimeToUtc,
  getZonedDayRangeUtc,
  formatDateTimeInZone,
  parseExplicitUtcInstant,
  isValidTimeZone,
} from "../src/utils/timezone.js";

const iso = (date) => date.toISOString();

const hoursInDay = (dateString, timeZone) => {
  const { start, end } = getZonedDayRangeUtc(dateString, timeZone);
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
};

test("zonedDateTimeToUtc: wall clock to UTC across zones and seasons", () => {
  assert.equal(
    iso(zonedDateTimeToUtc("2026-01-15", "08:00", "Asia/Kolkata")),
    "2026-01-15T02:30:00.000Z"
  );
  assert.equal(
    iso(zonedDateTimeToUtc("2026-07-15", "08:00", "Asia/Kolkata")),
    "2026-07-15T02:30:00.000Z"
  );
  assert.equal(
    iso(zonedDateTimeToUtc("2026-07-15", "08:00", "America/New_York")),
    "2026-07-15T12:00:00.000Z"
  );
  assert.equal(
    iso(zonedDateTimeToUtc("2026-01-15", "08:00", "America/New_York")),
    "2026-01-15T13:00:00.000Z"
  );
  assert.equal(
    iso(zonedDateTimeToUtc("2026-07-15", "08:00", "Europe/London")),
    "2026-07-15T07:00:00.000Z"
  );
  assert.equal(
    iso(zonedDateTimeToUtc("2026-01-15", "08:00", "Europe/London")),
    "2026-01-15T08:00:00.000Z"
  );
});

test("getZonedDayRangeUtc: full local day, incl. 23h/25h DST days", () => {
  assert.equal(hoursInDay("2026-03-08", "America/New_York"), 23);
  assert.equal(hoursInDay("2026-11-01", "America/New_York"), 25);
  assert.equal(hoursInDay("2026-03-29", "Europe/London"), 23);
  assert.equal(hoursInDay("2026-10-25", "Europe/London"), 25);
  assert.equal(hoursInDay("2026-01-15", "Asia/Kolkata"), 24);
});

test("formatDateTimeInZone: one UTC instant, per-recipient local render", () => {
  const instant = new Date("2026-10-13T02:30:00.000Z");
  assert.equal(formatDateTimeInZone(instant, "America/New_York"), "2026-10-12 22:30");
  assert.equal(formatDateTimeInZone(instant, "Europe/London"), "2026-10-13 03:30");
  assert.equal(formatDateTimeInZone(instant, "Asia/Kolkata"), "2026-10-13 08:00");
});

test("parseExplicitUtcInstant: UTC round-trip is byte-for-byte stable", () => {
  const parsed = parseExplicitUtcInstant("2026-10-13T02:30:00.000Z");
  assert.equal(parsed.toISOString(), "2026-10-13T02:30:00.000Z");
});

test("parseExplicitUtcInstant: rejects offsetless (ambiguous) input", () => {
  assert.throws(() => parseExplicitUtcInstant("2026-10-13T02:30:00"));
  assert.throws(() => parseExplicitUtcInstant("2026-10-13"));
});

test("isValidTimeZone: accepts IANA zones, rejects junk", () => {
  assert.equal(isValidTimeZone("America/New_York"), true);
  assert.equal(isValidTimeZone("Europe/London"), true);
  assert.equal(isValidTimeZone("Asia/Kolkata"), true);
  assert.equal(isValidTimeZone("Not/AZone"), false);
  assert.equal(isValidTimeZone(""), false);
});
