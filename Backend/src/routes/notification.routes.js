import { Router } from "express";
import {
  getBookingNotificationsHandler,
  resendBookingNotificationsHandler,
} from "../controllers/notification.controller.js";

const router = Router();

// Demo-only, unauthenticated endpoints for local verification.
// Must be protected (auth/authorization) before any public deployment:
// anyone who can reach these routes can trigger or inspect notification sends.
router.post(
  "/:bookingId/notifications/send",
  resendBookingNotificationsHandler
);
router.get(
  "/:bookingId/notifications",
  getBookingNotificationsHandler
);

export default router;