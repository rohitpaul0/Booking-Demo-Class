import { getAvailableSlots } from "../services/slot.service.js";
import {
  TIME_ZONE,
  isValidDateString,
  isValidTimeZone,
} from "../utils/timezone.js";

export const getSlots = async (req, res) => {
  try {
    const { date, timeZone } = req.query;

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid 'date' query parameter in YYYY-MM-DD format is required",
      });
    }

    let displayTimeZone = TIME_ZONE;

    if (timeZone !== undefined) {
      if (!isValidTimeZone(timeZone)) {
        return res.status(400).json({
          success: false,
          message: `'timeZone' must be a valid IANA time-zone identifier (received: ${timeZone})`,
        });
      }

      displayTimeZone = timeZone;
    }

    const data = await getAvailableSlots(date, displayTimeZone);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch available slots:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
    });
  }
};