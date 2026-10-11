import api from "./api.js";

// Translate an Axios/HTTP failure into a message that is safe to show in the UI.
const toFriendlyMessage = (error) => {
  if (error?.response) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim() !== "") {
      return serverMessage;
    }
    return `The booking service responded with an error (status ${error.response?.status}).`;
  }
  if (error?.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }
  return "Could not reach the booking service. Check that the backend is running and try again.";
};

/**
 * Step 1 – Create a booking (returns bookingId and pending booking data).
 *
 * Backend contract:
 *   POST /bookings
 *   body: { parentName, parentEmail, studentName, parentTimeZone, startTime }
 *   -> { success: true, data: { bookingId, status, parent, student, mentor,
 *          startTime, endTime, parentLocal, mentorLocal, meeting } }
 */
export const createBooking = async ({
  parentName,
  parentEmail,
  studentName,
  parentTimeZone,
  startTime,
}) => {
  let response;
  try {
    response = await api.post("/bookings", {
      parentName,
      parentEmail,
      studentName,
      parentTimeZone,
      startTime,
    });
  } catch (error) {
    throw new Error(toFriendlyMessage(error));
  }

  const payload = response?.data;
  if (!payload || payload.success !== true || !payload.data) {
    throw new Error("Received an unexpected response from the booking service.");
  }

  return payload.data;
};

/**
 * Step 2 – Confirm a pending booking, generate the meeting link, and trigger
 * email notifications.
 *
 * Backend contract:
 *   POST /bookings/:bookingId/confirm
 *   -> { success: true, data: { ...bookingResponse, notifications } }
 */
export const confirmBooking = async (bookingId) => {
  let response;
  try {
    response = await api.post(`/bookings/${bookingId}/confirm`);
  } catch (error) {
    throw new Error(toFriendlyMessage(error));
  }

  const payload = response?.data;
  if (!payload || payload.success !== true || !payload.data) {
    throw new Error("Received an unexpected response from the booking service.");
  }

  return payload.data;
};
