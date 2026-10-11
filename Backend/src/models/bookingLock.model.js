import mongoose from "mongoose";

const bookingLockSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const BookingLock = mongoose.model("BookingLock", bookingLockSchema);

export default BookingLock;