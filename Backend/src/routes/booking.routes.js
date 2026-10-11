import { Router } from "express";
import {
  createBookingHandler,
  confirmBookingHandler,
} from "../controllers/booking.controller.js";

const router = Router();

router.post("/", createBookingHandler);
router.post("/:bookingId/confirm", confirmBookingHandler);

export default router;