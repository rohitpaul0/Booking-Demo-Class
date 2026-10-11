import mongoose from "mongoose";
import connectDB from "../db/db.js";
import Mentor from "../models/mentor.model.js";
import { zonedDateTimeToUtc } from "../utils/timezone.js";

const toSlot = (dateString, startTime, endTime) => ({
  startTime: zonedDateTimeToUtc(dateString, startTime),
  endTime: zonedDateTimeToUtc(dateString, endTime),
});

const DEMO_DATES = ["2026-10-12", "2026-10-13", "2026-10-14"];

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

// 10 mentors (all in India). With the 2 classes/day limit this gives roughly
// 20 bookable classes per day, matching ~20 parents/day. Availability is kept
// in the late-morning/evening IST window so it overlaps US and UK daytime.
const demoMentors = mentorProfiles.map((profile, index) => {
  const startHour = 8 + (index % 4);
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
