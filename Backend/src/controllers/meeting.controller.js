import Booking from "../models/booking.model.js";
import { formatDateTimeInZone } from "../utils/timezone.js";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export const getDemoClass = async (req, res) => {
  try {
    const { meetingToken } = req.params;

    if (!TOKEN_PATTERN.test(meetingToken)) {
      return res.status(404).json({
        success: false,
        message: "Demo class not found",
      });
    }

    const booking = await Booking.findOne({
      meetingToken,
      meetingStatus: "demo_ready",
      status: "confirmed",
    }).populate("mentor");

    if (!booking || !booking.mentor) {
      return res.status(404).json({
        success: false,
        message: "Demo class not found",
      });
    }

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const parentTimeZone = booking.parentTimeZone;
    const mentorTimeZone = booking.mentor.timeZone;

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        note:
          "This is a demo verification page only. No real video call is available.",
        class: {
          mentor: {
            name: booking.mentor.name,
            timeZone: mentorTimeZone,
          },
          studentName: booking.studentName,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          parentLocal: {
            timeZone: parentTimeZone,
            startTimeLocal: formatDateTimeInZone(start, parentTimeZone),
            endTimeLocal: formatDateTimeInZone(end, parentTimeZone),
          },
          mentorLocal: {
            timeZone: mentorTimeZone,
            startTimeLocal: formatDateTimeInZone(start, mentorTimeZone),
            endTimeLocal: formatDateTimeInZone(end, mentorTimeZone),
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load demo class:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load demo class",
    });
  }
};