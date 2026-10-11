import mongoose from "mongoose";
import { isValidTimeZone, TIME_ZONE } from "../utils/timezone.js";

const availabilitySlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: [true, "Slot start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "Slot end time is required"],
      validate: {
        validator: function (value) {
          if (!this.startTime || !value) {
            return true;
          }

          return value.getTime() > this.startTime.getTime();
        },
        message: "Slot end time must be later than its start time",
      },
    },
  },
  { _id: false }
);

const mentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Mentor name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Mentor email is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    timeZone: {
      type: String,
      default: TIME_ZONE,
      validate: {
        validator: isValidTimeZone,
        message: "Mentor time zone must be a valid IANA time-zone identifier",
      },
    },
    availableSlots: {
      type: [availabilitySlotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

mentorSchema.index({ isActive: 1, "availableSlots.startTime": 1 });

const Mentor = mongoose.model("Mentor", mentorSchema);

export default Mentor;
