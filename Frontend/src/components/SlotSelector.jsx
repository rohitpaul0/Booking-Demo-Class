import {
  AlertCircle,
  CalendarOff,
  Check,
  Clock,
  Globe,
  RefreshCw,
} from "lucide-react";
import Button from "./Button.jsx";
import Card from "./Card.jsx";

function SlotSelector({
  slots,
  selectedSlot,
  onSelect,
  hasDateSelected,
  timeZoneLabel,
  loading = false,
  loadError = "",
  onRetry,
  error,
}) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-teal-brand">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-ink">Choose a time</h3>
            <p className="text-sm text-muted">
              All times are shown in the time zone below.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-paleblue px-3 py-1 text-xs font-semibold text-secondary">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          {timeZoneLabel}
        </span>
      </div>

      {!hasDateSelected ? (
        <div className="rounded-xl border border-dashed border-border bg-paleblue/60 p-6 text-center">
          <Clock className="mx-auto h-6 w-6 text-secondary" aria-hidden="true" />
          <p className="mt-2 font-medium text-ink">Select a date first</p>
          <p className="text-sm text-muted">
            Available times will appear once you choose a date.
          </p>
        </div>
      ) : loading ? (
        <div>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            aria-hidden="true"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[60px] animate-pulse rounded-xl border border-border bg-background"
              />
            ))}
          </div>
          <span role="status" className="sr-only">
            Loading available times…
          </span>
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error/10 p-6 text-center"
        >
          <AlertCircle
            className="mx-auto h-6 w-6 text-error"
            aria-hidden="true"
          />
          <p className="mt-2 font-medium text-ink">
            Couldn&apos;t load available times
          </p>
          <p className="text-sm text-muted">{loadError}</p>
          {onRetry && (
            <Button variant="secondary" className="mt-4" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          )}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-peach/60 p-6 text-center">
          <CalendarOff
            className="mx-auto h-6 w-6 text-warning"
            aria-hidden="true"
          />
          <p className="mt-2 font-medium text-ink">No time slots available</p>
          <p className="text-sm text-muted">
            There are no open demo classes on this date. Please choose another day.
          </p>
        </div>
      ) : (
        <div
          role="group"
          aria-label="Available time slots"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center rounded-xl border px-3 py-3 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-transparent bg-linear-to-br from-primary to-secondary text-white shadow-md shadow-secondary/30"
                    : "border-border bg-paleblue text-ink hover:border-secondary/40 hover:bg-lavender"
                }`}
              >
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {isSelected && (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {slot.startTimeLocal}
                </span>
                <span
                  className={`text-xs ${
                    isSelected ? "text-white/80" : "text-muted"
                  }`}
                >
                  to {slot.endTimeLocal}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </Card>
  );
}

export default SlotSelector;
