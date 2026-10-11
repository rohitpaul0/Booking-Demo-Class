import { Router } from "express";
import { getDemoClass } from "../controllers/meeting.controller.js";

const router = Router();

router.get("/:meetingToken", getDemoClass);

export default router;