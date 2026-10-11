import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import BookingHeader from "../components/BookingHeader.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import BookingForm from "../components/BookingForm.jsx";
import DateSelector from "../components/DateSelector.jsx";
import SlotSelector from "../components/SlotSelector.jsx";
import BookingSummary from "../components/BookingSummary.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import PageContainer from "../components/PageContainer.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { getAvailableSlots } from "../services/slotService.js";
import { createBooking, confirmBooking } from "../services/bookingService.js";
import { getSelectableDates } from "../utils/dateOptions.js";
import { DISPLAY_TIME_ZONE, getTimeZoneLabel } from "../utils/timezone.js";

const STEPS = ["Your details", "Choose a time", "Review booking"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only treat a saved meeting link as usable when it is a well-formed http(s)
// URL, so a missing or malformed value never renders as a broken link.
const isValidMeetingUrl = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const INITIAL_VALUES = {
  parentName: "",
  parentEmail: "",
  studentName: "",
};

const HERO_FEATURES = [
  { icon: Clock, label: "30-minute session" },
  { icon: CalendarDays, label: "Pick your own time" },
  { icon: Mail, label: "Details sent by email" },
];

const buildReviewRows = (values, dateLabel, timeLabel, timeZoneLabel) => [
  { label: "Parent", value: values.parentName },
  { label: "Email", value: values.parentEmail, break: true },
  { label: "Student", value: values.studentName },
  { label: "Time zone", value: timeZoneLabel },
  { label: "Date", value: dateLabel },
  { label: "Time", value: timeLabel },
];

// ─── Notification status badge ──────────────────────────────────────────────

function NotificationBadge({ label, status, error }) {
  const isSimulated =
    status === "sent" &&
    typeof error !== "string" &&
    !error;

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-teal-brand shrink-0" aria-hidden="true" />
        <span className="font-medium text-ink">{label}</span>
        <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-teal-brand">
          Sent (simulated)
        </span>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-error shrink-0" aria-hidden="true" />
          <span className="font-medium text-ink">{label}</span>
          <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
            Failed
          </span>
        </div>
        {error && (
          <p className="ml-6 text-xs text-muted">{error}</p>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label} — pending</span>
    </div>
  );
}

// ─── Confirmed booking card ──────────────────────────────────────────────────

function ConfirmedBookingCard({ booking, onBookAgain }) {
  const { parent, student, mentor, parentLocal, mentorLocal, meeting, notifications } = booking;

  const isEmailSimulated =
    process.env.NODE_ENV !== "production" || !import.meta.env.VITE_SMTP_REAL;

  return (
    <Card className="space-y-6 border-teal-brand/30 bg-mint/20">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-teal-brand to-secondary text-white shadow-md shadow-teal-brand/30">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">Booking confirmed!</h2>
          <p className="text-sm text-muted">
            {student?.name}&apos;s demo class has been scheduled.
          </p>
        </div>
      </div>

      {/* Class details */}
      <dl className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Mentor</dt>
          <dd className="text-sm font-semibold text-ink">{mentor?.name}</dd>
          <dd className="text-xs text-muted">{mentor?.timeZone}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Student</dt>
          <dd className="text-sm font-semibold text-ink">{student?.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Your time ({parentLocal?.timeZone})
          </dt>
          <dd className="text-sm font-semibold text-ink">
            {parentLocal?.startTimeLocal} – {parentLocal?.endTimeLocal}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Mentor time ({mentorLocal?.timeZone})
          </dt>
          <dd className="text-sm font-semibold text-ink">
            {mentorLocal?.startTimeLocal} – {mentorLocal?.endTimeLocal}
          </dd>
        </div>
      </dl>

      {/* Meeting link */}
      <div
        className={`rounded-xl border p-4 ${
          meeting?.created && isValidMeetingUrl(meeting?.link)
            ? "border-secondary/20 bg-paleblue"
            : "border-warning/20 bg-peach"
        }`}
      >
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
          Jitsi Meet room
        </p>
        {isValidMeetingUrl(meeting?.link) ? (
          <>
            <a
              href={meeting.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary underline-offset-2 hover:underline"
            >
              Join the meeting
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <p className="mt-1 break-all text-xs text-muted">{meeting.link}</p>
            {meeting?.message && (
              <p className="mt-1 text-xs text-muted">{meeting.message}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            {meeting?.message ||
              "A meeting link is not available yet for this booking."}
          </p>
        )}
      </div>

      {/* Email notifications */}
      {notifications && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-secondary" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">Email notifications</p>
            <span className="rounded-full bg-paleblue px-2 py-0.5 text-xs font-medium text-secondary">
              Simulated — no real emails sent
            </span>
          </div>
          <div className="space-y-2">
            <NotificationBadge
              label={`Parent (${parent?.email})`}
              status={notifications?.parent?.status}
              error={notifications?.parent?.error}
            />
            <NotificationBadge
              label={`Mentor (${mentor?.email})`}
              status={notifications?.mentor?.status}
              error={notifications?.mentor?.error}
            />
          </div>
          <p className="text-xs text-muted">
            Email delivery is simulated via the <code>json</code> transport. In
            production, configure real SMTP credentials to send actual emails.
          </p>
        </div>
      )}

      <Button variant="secondary" onClick={onBookAgain}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Book another class
      </Button>
    </Card>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

function BookingPage() {
  const dateOptions = useMemo(() => getSelectableDates(), []);

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reviewRequested, setReviewRequested] = useState(false);

  // Real availability from the backend.
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slotsTimeZone, setSlotsTimeZone] = useState(DISPLAY_TIME_ZONE);
  const [reloadToken, setReloadToken] = useState(0);

  // Booking submission state.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // The backend requires a specific date, so slots load when the date changes
  // (and on retry). Responses from a superseded date are ignored.
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setSlotsError("");
      setSlotsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");

    getAvailableSlots({ date: selectedDate, timeZone: DISPLAY_TIME_ZONE })
      .then((result) => {
        if (cancelled) return;
        setSlots(result.slots);
        setSlotsTimeZone(result.timeZone || DISPLAY_TIME_ZONE);
        // Keep the selected time only if the backend still offers it.
        setSelectedSlot((prev) =>
          prev && result.slots.some((slot) => slot.id === prev.id) ? prev : null
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(error.message);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, reloadToken]);

  const selectedDateEntry =
    dateOptions.find((item) => item.date === selectedDate) ?? null;

  const timeZoneLabel = useMemo(
    () => getTimeZoneLabel(slotsTimeZone),
    [slotsTimeZone]
  );

  const detailsComplete = Boolean(
    values.parentName.trim() && values.parentEmail.trim() && values.studentName.trim()
  );
  const timeComplete = Boolean(selectedDate && selectedSlot);
  const currentStep = timeComplete ? 3 : detailsComplete ? 2 : 1;

  const handleFieldChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setReviewRequested(false);
    setSubmitError("");
  };

  const handleDateSelect = (dateKey) => {
    setSelectedDate(dateKey);
    // A time belongs to one date only, so any previous selection is now invalid.
    setSelectedSlot(null);
    setSlots([]);
    setErrors((prev) => (prev.date ? { ...prev, date: undefined } : prev));
    setReviewRequested(false);
    setSubmitError("");
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setErrors((prev) => (prev.slot ? { ...prev, slot: undefined } : prev));
    setReviewRequested(false);
    setSubmitError("");
  };

  const handleRetry = () => {
    setReloadToken((token) => token + 1);
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setSelectedDate("");
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError("");
    setErrors({});
    setReviewRequested(false);
    setSubmitError("");
    setConfirmedBooking(null);
  };

  const validate = () => {
    const next = {};

    if (!values.parentName.trim()) {
      next.parentName = "Please enter the parent's full name.";
    } else if (values.parentName.trim().length < 2) {
      next.parentName = "This name looks too short.";
    }

    const email = values.parentEmail.trim();
    if (!email) {
      next.parentEmail = "Please enter an email address.";
    } else if (!EMAIL_REGEX.test(email)) {
      next.parentEmail = "Please enter a valid email address.";
    }

    if (!values.studentName.trim()) {
      next.studentName = "Please enter the student's name.";
    }

    if (!selectedDate) {
      next.date = "Please choose a date.";
    }

    if (!selectedSlot) {
      next.slot = "Please choose a time.";
    }

    return next;
  };

  const handleReview = () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setReviewRequested(false);
      return;
    }

    setReviewRequested(true);
    setSubmitError("");
  };

  /**
   * Two-step booking submission:
   *  1. POST /bookings  → creates pending booking, assigns mentor
   *  2. POST /bookings/:id/confirm → confirms, generates meeting link, sends emails
   */
  const handleConfirmBooking = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // Step 1: create pending booking
      const pending = await createBooking({
        parentName: values.parentName.trim(),
        parentEmail: values.parentEmail.trim().toLowerCase(),
        studentName: values.studentName.trim(),
        parentTimeZone: DISPLAY_TIME_ZONE,
        startTime: selectedSlot.startTime,
      });

      // Step 2: confirm, generate meeting link, trigger notifications
      const confirmed = await confirmBooking(pending.bookingId);

      setConfirmedBooking(confirmed);
      setReviewRequested(false);
    } catch (error) {
      setSubmitError(error.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // If booking succeeded, show the confirmation screen.
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="py-8 sm:py-12">
          <PageContainer>
            <ConfirmedBookingCard
              booking={confirmedBooking}
              onBookAgain={handleReset}
            />
          </PageContainer>
        </main>
        <footer className="border-t border-border bg-surface">
          <PageContainer className="py-6 text-center text-sm text-muted sm:text-left">
            Booking Demo Class — full-stack demo.
          </PageContainer>
        </footer>
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  const dateLabel = selectedDateEntry ? selectedDateEntry.fullLabel : "";
  const timeLabel = selectedSlot
    ? `${selectedSlot.startTimeLocal} – ${selectedSlot.endTimeLocal}`
    : "";
  const isComplete = detailsComplete && timeComplete;

  return (
    <div className="min-h-screen bg-background">
      <BookingHeader />

      <main className="py-8 sm:py-12">
        <PageContainer>
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm shadow-slate-200/70 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-linear-to-br from-lavender via-paleblue to-mint opacity-80 blur-2xl"
              />
              <div className="relative space-y-6">
                <SectionHeading
                  eyebrow="Free Demo Class"
                  title={
                    <>
                      Book Your{" "}
                      <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Free Demo Class
                      </span>
                    </>
                  }
                  description="Choose an available time and share a few details. We will use them only to arrange your child's demo class."
                />

                <ul className="flex flex-wrap gap-2">
                  {HERO_FEATURES.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-paleblue px-3 py-1 text-xs font-medium text-secondary"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="border-t border-border pt-6">
                  <StepIndicator steps={STEPS} currentStep={currentStep} />
                </div>
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="space-y-6">
                <BookingForm
                  values={values}
                  errors={errors}
                  onChange={handleFieldChange}
                />

                <DateSelector
                  dates={dateOptions}
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  error={errors.date}
                />

                <SlotSelector
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={handleSlotSelect}
                  hasDateSelected={Boolean(selectedDate)}
                  timeZoneLabel={timeZoneLabel}
                  loading={slotsLoading}
                  loadError={slotsError}
                  onRetry={handleRetry}
                  error={errors.slot}
                />

                <div className="space-y-4">
                  {hasErrors && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error"
                    >
                      <AlertCircle
                        className="mt-0.5 h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="font-medium">
                        Please fix the highlighted fields and selections before
                        reviewing your booking.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      onClick={handleReview}
                      className="px-6 py-3 text-base"
                    >
                      Review Booking
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button variant="secondary" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Reset
                    </Button>
                  </div>

                  {reviewRequested && (
                    <Card className="space-y-5 border-secondary/30">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30">
                          <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg font-semibold text-ink">
                          Review your booking
                        </h3>
                      </div>

                      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                        {buildReviewRows(
                          values,
                          dateLabel,
                          timeLabel,
                          timeZoneLabel
                        ).map((row) => (
                          <div key={row.label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                              {row.label}
                            </dt>
                            <dd
                              className={`text-sm font-medium text-ink ${
                                row.break ? "break-all" : ""
                              }`}
                            >
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {submitError && (
                        <div
                          role="alert"
                          className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error"
                        >
                          <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <p>{submitError}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="primary"
                          onClick={handleConfirmBooking}
                          disabled={submitting}
                          className="px-6 py-3 text-base"
                          id="confirm-booking-btn"
                        >
                          {submitting ? (
                            <>
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                              Confirming…
                            </>
                          ) : (
                            <>
                              <CalendarCheck
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Confirm Booking
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReviewRequested(false);
                            setSubmitError("");
                          }}
                          disabled={submitting}
                        >
                          <PencilLine className="h-4 w-4" aria-hidden="true" />
                          Edit details
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              <BookingSummary
                parentName={values.parentName.trim()}
                studentName={values.studentName.trim()}
                dateLabel={dateLabel}
                timeLabel={timeLabel}
                timeZoneLabel={timeZoneLabel}
                isComplete={isComplete}
                className="lg:sticky lg:top-24"
              />
            </div>
          </div>
        </PageContainer>
      </main>

      <footer className="border-t border-border bg-surface">
        <PageContainer className="py-6 text-center text-sm text-muted sm:text-left">
          Booking Demo Class — full-stack demo.
        </PageContainer>
      </footer>
    </div>
  );
}

export default BookingPage;
