import mongoose from "mongoose";
import connectDB from "../db/db.js";
import Mentor from "../models/mentor.model.js";
import { zonedDateTimeToUtc } from "../utils/timezone.js";

const toSlot = (dateString, startTime, endTime) => ({
  startTime: zonedDateTimeToUtc(dateString, startTime),
  endTime: zonedDateTimeToUtc(dateString, endTime),
});

/**
 * Build an array of YYYY-MM-DD strings for the next `days` calendar days
 * starting from tomorrow (Asia/Kolkata).
 */
const getUpcomingDates = (days = 7) => {
  const now = new Date();
  // Use Intl to get today's date in IST so the seed is timezone-correct.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }

  const dates = [];
  for (let offset = 1; offset <= days; offset++) {
    const d = new Date(Date.UTC(values.year, values.month - 1, values.day + offset, 6));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
};

const DEMO_DATES = getUpcomingDates(7);

const mentorProfiles = [
  { name: "Aditi Nair", email: "aditi.nair@example.com" },
  { name: "Rahul Menon", email: "rahul.menon@example.com" },
  { name: "Sana Kapoor", email: "sana.kapoor@example.com" },
  { name: "Vikram Rao", email: "vikram.rao@example.com" },
  { name: "Neha Sharma", email: "neha.sharma@example.com" },
  { name: "Arjun Iyer", email: "arjun.iyer@example.com" },
  { name: "Priya Das", email: "priya.das@example.com" },
  { name: "Karan Gupta", email: "karan.gupta@example.com" },
  { name: "Meera Joshi", email: "meera.joshi@example.com" },
  { name: "Rohit Verma", email: "rohit.verma@example.com" },
];

// 10 mentors (all in Asia/Kolkata). With the 2-class/day limit this gives
// up to 20 bookable classes per day, matching ~20 parents/day. Availability
// windows are staggered so different mentors cover different hours, giving
// breadth across the IST day (which overlaps US and UK daytime).
const demoMentors = mentorProfiles.map((profile, index) => {
  const startHour = 8 + (index % 4); // 08, 09, 10, 11 repeated
  const startTime = `${String(startHour).padStart(2, "0")}:00`;

  return {
    ...profile,
    timeZone: "Asia/Kolkata",
    isActive: true,
    availableSlots: DEMO_DATES.map((date) => toSlot(date, startTime, "21:00")),
  };
});

const seedMentors = async () => {
  let created = 0;
  let updated = 0;

  console.log(`Seeding mentors for dates: ${DEMO_DATES.join(", ")}`);

  for (const mentorData of demoMentors) {
    const existing = await Mentor.findOne({ email: mentorData.email });

    if (existing) {
      existing.name = mentorData.name;
      existing.timeZone = mentorData.timeZone;
      existing.isActive = mentorData.isActive;
      existing.availableSlots = mentorData.availableSlots;
      await existing.save();
      updated += 1;
    } else {
      await Mentor.create(mentorData);
      created += 1;
    }
  }

  console.log(
    `Seed complete. Created: ${created}, Updated: ${updated}, Total: ${demoMentors.length}`
  );
};

const run = async () => {
  await connectDB();

  try {
    await seedMentors();
  } catch (error) {
    console.error("Seeding mentors failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
