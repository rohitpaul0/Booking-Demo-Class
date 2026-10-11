import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Globe,
  User,
  Users,
} from "lucide-react";
import Card from "./Card.jsx";

const TONES = {
  lavender: "bg-lavender text-primary",
  violet: "bg-violet text-primary",
  blue: "bg-paleblue text-secondary",
  mint: "bg-mint text-teal-brand",
};

function SummaryRow({ icon: Icon, label, value, missing, tone }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </dt>
        <dd className={`text-sm ${missing ? "italic text-muted" : "font-medium text-ink"}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function BookingSummary({
  parentName,
  studentName,
  dateLabel,
  timeLabel,
  timeZoneLabel,
  isComplete,
  className = "",
}) {
  return (
    <Card className={`space-y-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-ink">Booking summary</h3>
      </div>

      <dl className="space-y-3.5">
        <SummaryRow
          icon={User}
          tone="lavender"
          label="Parent"
          value={parentName || "Not provided yet"}
          missing={!parentName}
        />
        <SummaryRow
          icon={Users}
          tone="violet"
          label="Student"
          value={studentName || "Not provided yet"}
          missing={!studentName}
        />
      </dl>

      <div className="space-y-3 rounded-2xl border border-secondary/15 bg-paleblue p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-secondary">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary/70">
              Date
            </p>
            <p className={`text-sm ${dateLabel ? "font-medium text-ink" : "italic text-muted"}`}>
              {dateLabel || "Not selected yet"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-secondary">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary/70">
              Time
            </p>
            <p className={`text-sm ${timeLabel ? "font-medium text-ink" : "italic text-muted"}`}>
              {timeLabel || "Not selected yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-teal-brand/20 bg-mint/70 px-3.5 py-2.5">
        <Globe className="h-4 w-4 shrink-0 text-teal-brand" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-brand/80">
            Time zone
          </p>
          <p className="text-sm font-medium text-ink">{timeZoneLabel}</p>
        </div>
      </div>

      <div
        role="status"
        className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
          isComplete
            ? "border-teal-brand/25 bg-mint/60 text-teal-brand"
            : "border-warning/25 bg-peach text-warning"
        }`}
      >
        {isComplete ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <p className="font-medium">
          {isComplete
            ? "All set — review your booking to continue."
            : "Complete the highlighted steps to continue."}
        </p>
      </div>
    </Card>
  );
}

export default BookingSummary;
