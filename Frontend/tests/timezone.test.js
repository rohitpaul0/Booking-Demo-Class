import test from "node:test";
import assert from "node:assert/strict";
import {
  getTimeZoneLabel,
  detectTimeZone,
  FALLBACK_TIME_ZONE,
} from "../src/utils/timezone.js";

test("getTimeZoneLabel: New York offset follows the class date (EDT vs EST)", () => {
  const summer = getTimeZoneLabel("America/New_York", new Date("2026-07-15T00:00:00Z"));
  const winter = getTimeZoneLabel("America/New_York", new Date("2026-01-15T00:00:00Z"));

  assert.equal(summer, "America/New_York (EDT)");
  assert.equal(winter, "America/New_York (EST)");
  assert.notEqual(summer, winter);
});

test("getTimeZoneLabel: London offset follows the class date (BST vs GMT)", () => {
  const summer = getTimeZoneLabel("Europe/London", new Date("2026-07-15T00:00:00Z"));
  const winter = getTimeZoneLabel("Europe/London", new Date("2026-01-15T00:00:00Z"));

  assert.equal(summer, "Europe/London (GMT+1)");
  assert.equal(winter, "Europe/London (GMT)");
});

test("getTimeZoneLabel: Kolkata has no DST, label is stable year-round", () => {
  const jan = getTimeZoneLabel("Asia/Kolkata", new Date("2026-01-15T00:00:00Z"));
  const jul = getTimeZoneLabel("Asia/Kolkata", new Date("2026-07-15T00:00:00Z"));

  assert.equal(jan, "Asia/Kolkata (GMT+5:30)");
  assert.equal(jan, jul);
});

test("getTimeZoneLabel: accepts an ISO string instant, ignores an invalid one", () => {
  assert.equal(
    getTimeZoneLabel("America/New_York", "2026-07-15T00:00:00Z"),
    "America/New_York (EDT)"
  );
  assert.equal(getTimeZoneLabel("America/New_York", "not-a-date"), "America/New_York");
});

test("getTimeZoneLabel: surfaces the zone unchanged when Intl cannot label it", () => {
  assert.equal(
    getTimeZoneLabel("Not/AZone", new Date("2026-01-15T00:00:00Z")),
    "Not/AZone"
  );
});

test("detectTimeZone: returns a valid IANA zone or the fallback", () => {
  const detected = detectTimeZone();

  assert.equal(typeof detected, "string");
  assert.ok(detected.length > 0);

  if (detected !== FALLBACK_TIME_ZONE) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en-US", { timeZone: detected }));
  }
});
