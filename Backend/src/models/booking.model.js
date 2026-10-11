import mongoose from "mongoose";
import { isValidTimeZone, TIME_ZONE } from "../utils/timezone.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const notificationRecipientSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: {
        values: ["pending", "sent", "failed"],
        message: "{VALUE} is not a supported notification status",
      },
      default: "pending",
    },
    sentAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: [true, "Parent name is required"],
      trim: true,
    },
    parentEmail: {
      type: String,
      required: [true, "Parent email is required"],
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please provide a valid parent email address"],
    },
    parentTimeZone: {
      type: String,
      default: TIME_ZONE,
      validate: {
        validator: isValidTimeZone,
        message:
          "Parent time zone must be a valid IANA time-zone identifier",
      },
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      default: null,
    },
    startTime: {
      type: Date,
      required: [true, "Booking start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "Booking end time is required"],
      validate: {
        validator: function (value) {
          if (!this.startTime || !value) {
            return true;
          }

          return value.getTime() > this.startTime.getTime();
        },
        message: "Booking end time must be later than its start time",
      },
    },
    meetingLink: {
      type: String,
      default: null,
    },
    meetingRoomName: {
      type: String,
      default: null,
    },
    meetingToken: {
      type: String,
      default: null,
    },
    meetingStatus: {
      type: String,
      enum: {
        values: ["not_created", "demo_ready", "failed"],
        message: "{VALUE} is not a supported meeting status",
      },
      default: "not_created",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled"],
        message: "{VALUE} is not a supported booking status",
      },
      default: "pending",
    },
    notifications: {
      parent: {
        type: notificationRecipientSchema,
        default: () => ({}),
      },
      mentor: {
        type: notificationRecipientSchema,
        default: () => ({}),
      },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ mentor: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ parentEmail: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ meetingToken: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
