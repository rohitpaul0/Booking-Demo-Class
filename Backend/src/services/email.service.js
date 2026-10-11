import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import nodemailer from "nodemailer";
import Booking from "../models/booking.model.js";
import { formatDateInZone, formatTimeInZone } from "../utils/timezone.js";
import ApiError from "../utils/ApiError.js";

const TEMPLATE_DIR = fileURLToPath(new URL("../templates/", import.meta.url));
const APP_NAME = process.env.APP_NAME || "Booking Demo Class";

const templateCache = new Map();

const loadTemplate = async (fileName) => {
  if (!templateCache.has(fileName)) {
    templateCache.set(fileName, await fs.readFile(path.join(TEMPLATE_DIR, fileName), "utf8"));
  }

  return templateCache.get(fileName);
};

const renderTemplate = (template, values) =>
  template.replace(
    /\{\{(\w+)\}\}/g,
    (_match, key) => (values[key] !== undefined ? values[key] : "")
  );

export const getSmtpConfig = () => ({
  transport: (process.env.SMTP_TRANSPORT || "smtp").toLowerCase(),
  host: process.env.SMTP_HOST || "",
  port: process.env.SMTP_PORT || "",
  secure: process.env.SMTP_SECURE === "true",
  from: process.env.MAIL_FROM || "Booking Demo Class <no-reply@localhost>",
  requiresAuth: process.env.SMTP_AUTH !== "false",
});

export const buildTransporter = () => {
  const config = getSmtpConfig();

  if (config.transport === "json") {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (config.transport === "stream") {
    return nodemailer.createTransport({ streamTransport: true, buffer: true });
  }

  if (config.transport !== "smtp") {
    throw new ApiError(
      500,
      `Unknown SMTP_TRANSPORT "${config.transport}". Supported values: smtp, json, stream.`
    );
  }

  if (!config.host || !config.port) {
    throw new ApiError(
      500,
      "SMTP configuration is incomplete: SMTP_HOST and SMTP_PORT must be set."
    );
  }

  if (config.requiresAuth && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    throw new ApiError(
      500,
      "SMTP authentication is required: SMTP_USER and SMTP_PASS must be set (or set SMTP_AUTH=false for local servers that need no authentication)."
    );
  }

  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure,
    ...(config.requiresAuth
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {}),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
  });
};

export const scrubSecrets = (message) => {
  let scrubbed = String(message || "");
  const secrets = [process.env.SMTP_PASS, process.env.SMTP_USER].filter(Boolean);

  for (const secret of secrets) {
    if (secret.length >= 4) {
      scrubbed = scrubbed.split(secret).join("***");
    }
  }

  return scrubbed.slice(0, 300);
};

export const bookingReference = (bookingId) =>
  `BKG-${String(bookingId).slice(-8).toUpperCase()}`;

const friendlyZoneName = (timeZone) => {
  const parts = timeZone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
};

export const meetingNoticeFragments = (meetingLink) => {
  if (!meetingLink) {
    return {
      html:
        '<p style="margin: 16px 0 0; font-size: 14px; color: #b45309;">' +
        "A demo classroom link is not available yet for this booking.</p>",
      text: "A demo classroom link is not available yet for this booking.",
    };
  }

  return {
    html:
      `<p style="margin: 16px 0 0; font-size: 14px;">Demo classroom link` +
      ` <span style="color: #6b7280;">(demonstration only)</span>: ` +
      `<a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a></p>` +
      '<p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">' +
      "This link is for demonstration only and does not provide a real video call.</p>",
    text:
      `Demo classroom link (demonstration only): ${meetingLink}\n` +
      "This link is for demonstration only and does not provide a real video call.",
  };
};

const collectBookingMailValues = ({ booking, mentor, meetingFragments }) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const reference = bookingReference(booking._id);

  return {
    appName: APP_NAME,
    bookingReference: reference,
    studentName: booking.studentName,
    mentorName: mentor.name,
    parentName: booking.parentName,
    parentEmail: booking.parentEmail,
    meetingNotice: meetingFragments.html,
    meetingLink: booking.meetingLink || "",
  };
};

export const buildParentConfirmationMail = async ({ booking, mentor }) => {
  const timeZone = booking.parentTimeZone;
  const fragments = meetingNoticeFragments(booking.meetingLink);
  const values = collectBookingMailValues({ booking, mentor, meetingFragments: fragments });

  const common = {
    ...values,
    classDate: formatDateInZone(new Date(booking.startTime), timeZone),
    classStartTime: formatTimeInZone(new Date(booking.startTime), timeZone),
    classEndTime: formatTimeInZone(new Date(booking.endTime), timeZone),
    timeZoneLabel: `${timeZone} (${friendlyZoneName(timeZone)})`,
  };

  return {
    to: booking.parentEmail,
    subject: `Your trial class with ${mentor.name} is booked (${bookingReference(booking._id)})`,
    text: renderTemplate(
      await loadTemplate("parent-booking-confirmation.txt"),
      { ...common, meetingNotice: fragments.text }
    ),
    html: renderTemplate(
      await loadTemplate("parent-booking-confirmation.html"),
      common
    ),
  };
};

export const buildMentorNotificationMail = async ({ booking, mentor }) => {
  const timeZone = mentor.timeZone;
  const fragments = meetingNoticeFragments(booking.meetingLink);
  const values = collectBookingMailValues({ booking, mentor, meetingFragments: fragments });

  const common = {
    ...values,
    classDate: formatDateInZone(new Date(booking.startTime), timeZone),
    classStartTime: formatTimeInZone(new Date(booking.startTime), timeZone),
    classEndTime: formatTimeInZone(new Date(booking.endTime), timeZone),
    timeZoneLabel: `${timeZone} (${friendlyZoneName(timeZone)})`,
  };

  return {
    to: mentor.email,
    subject: `New trial class with ${booking.studentName} (${bookingReference(booking._id)})`,
    text: renderTemplate(
      await loadTemplate("mentor-booking-notification.txt"),
      { ...common, meetingNotice: fragments.text }
    ),
    html: renderTemplate(
      await loadTemplate("mentor-booking-notification.html"),
      common
    ),
  };
};

export const sendMail = async ({ to, subject, text, html }) => {
  const config = getSmtpConfig();
  const failFor = (process.env.DEMO_FAIL_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (config.transport !== "smtp" && failFor.includes(to.toLowerCase())) {
    throw new Error(
      "Simulated SMTP failure for demonstration: recipient matched DEMO_FAIL_EMAILS"
    );
  }

  const info = await buildTransporter().sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });

  const accepted = Array.isArray(info.accepted) ? info.accepted : to;
  const rejected = Array.isArray(info.rejected) ? info.rejected : [];
  const response = info.response || null;

  if (rejected.includes(to)) {
    const error = new Error(
      `SMTP server rejected the recipient (response: ${String(response || "none")})`
    );
    error.rejectedByServer = true;
    throw error;
  }

  return { to, accepted, rejected, response };
};

const deliverToRecipient = async (recipientKey, booking) => {
  if (!booking.notifications) {
    booking.notifications = { parent: {}, mentor: {} };
  }

  const record = booking.notifications[recipientKey] || {};
  const current = {
    status: record.status || "pending",
    sentAt: record.sentAt || null,
    attempts: record.attempts || 0,
    error: record.error || null,
  };

  if (current.status === "sent") {
    return {
      recipient: recipientKey,
      to: recipientKey === "parent" ? booking.parentEmail : booking.mentor.email,
      status: "sent",
      skipped: true,
      reason: "already_sent",
      sentAt: current.sentAt,
      attempts: current.attempts,
    };
  }

  const mail =
    recipientKey === "parent"
      ? await buildParentConfirmationMail({ booking, mentor: booking.mentor })
      : await buildMentorNotificationMail({ booking, mentor: booking.mentor });

  const attempts = current.attempts + 1;

  try {
    await sendMail(mail);
    booking.notifications[recipientKey] = {
      status: "sent",
      sentAt: new Date(),
      attempts,
      error: null,
    };
    await booking.save();

    return {
      recipient: recipientKey,
      to: mail.to,
      status: "sent",
      skipped: false,
      sentAt: booking.notifications[recipientKey].sentAt,
      attempts,
    };
  } catch (error) {
    booking.notifications[recipientKey] = {
      status: "failed",
      sentAt: null,
      attempts,
      error: scrubSecrets(error.message || error),
    };
    await booking.save();

    return {
      recipient: recipientKey,
      to: mail.to,
      status: "failed",
      skipped: false,
      error: scrubSecrets(error.message || error),
      attempts,
    };
  }
};

export const sendBookingNotifications = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("mentor");

  if (!booking) {
    throw new ApiError(404, `Booking ${bookingId} was not found`);
  }

  if (!booking.mentor) {
    throw new ApiError(409, "Cannot send notifications: booking has no assigned mentor");
  }

  if (booking.status !== "confirmed") {
    throw new ApiError(
      409,
      `Cannot send notifications: booking status is "${booking.status}", expected "confirmed"`
    );
  }

  const parent = await deliverToRecipient("parent", booking);
  const mentor = await deliverToRecipient("mentor", booking);

  return { bookingId: booking._id.toString(), parent, mentor };
};

export const getBookingNotificationStatus = async (bookingId) => {
  const booking = await Booking.findById(bookingId).select(
    "parentName parentEmail mentor status meetingLink notifications"
  );

  if (!booking) {
    throw new ApiError(404, `Booking ${bookingId} was not found`);
  }

  await booking.populate("mentor", "name email timeZone");

  const parentRecord = (booking.notifications || {}).parent || {};
  const mentorRecord = (booking.notifications || {}).mentor || {};

  return {
    bookingId: booking._id.toString(),
    bookingStatus: booking.status,
    meetingLink: booking.meetingLink,
    parent: {
      name: booking.parentName,
      email: booking.parentEmail,
      status: parentRecord.status || "pending",
      sentAt: parentRecord.sentAt || null,
      attempts: parentRecord.attempts || 0,
      error: parentRecord.error || null,
    },
    mentor: {
      name: booking.mentor ? booking.mentor.name : null,
      email: booking.mentor ? booking.mentor.email : null,
      status: mentorRecord.status || "pending",
      sentAt: mentorRecord.sentAt || null,
      attempts: mentorRecord.attempts || 0,
      error: mentorRecord.error || null,
    },
  };
};