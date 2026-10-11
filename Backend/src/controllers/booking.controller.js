import {
  createBooking,
  confirmBooking,
  buildBookingResponse,
} from "../services/booking.service.js";
import ApiError from "../utils/ApiError.js";

export const createBookingHandler = async (req, res) => {
  try {
    const { booking, mentor } = await createBooking(req.body || {});

    return res
      .status(201)
      .json({ success: true, data: buildBookingResponse(booking, mentor) });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to create booking:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

export const confirmBookingHandler = async (req, res) => {
  try {
    const { booking, mentor, notifications } = await confirmBooking(
      req.params.bookingId
    );

    return res.status(200).json({
      success: true,
      data: { ...buildBookingResponse(booking, mentor), notifications },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to confirm booking:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm booking",
    });
  }
};