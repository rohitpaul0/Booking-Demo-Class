import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import slotRoutes from "./routes/slot.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Booking Demo Class Backend is running!");
});

app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookings", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isMalformedJson = error.type === "entity.parse.failed";
  const statusCode = error.statusCode || (isMalformedJson ? 400 : 500);

  if (statusCode >= 500) {
    console.error("Unhandled error:", error.message);
  }

  return res.status(statusCode).json({
    success: false,
    message: isMalformedJson ? "Invalid JSON request body" : "Internal server error",
  });
});

export default app;
