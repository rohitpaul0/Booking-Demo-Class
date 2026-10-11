import {
  getBookingNotificationStatus,
  sendBookingNotifications,
} from "../services/email.service.js";
import ApiError from "../utils/ApiError.js";

export const resendBookingNotificationsHandler = async (req, res) => {
  try {
    const result = await sendBookingNotifications(req.params.bookingId);

    return res
      .status(200)
      .json({ success: true, message: "Notification delivery attempt completed", data: result });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to send booking notifications:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send booking notifications",
    });
  }
};

export const getBookingNotificationsHandler = async (req, res) => {
  try {
    const data = await getBookingNotificationStatus(req.params.bookingId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to load booking notification status",
    });
  }
};