import { CalendarDays, Check } from "lucide-react";
import Card from "./Card.jsx";

function DateSelector({ dates, selectedDate, onSelect, error }) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">Choose a date</h3>
          <p className="text-sm text-muted">
            Pick an available day for the 30-minute demo class.
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Available dates"
        className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-7"
      >
        {dates.map((item) => {
          const isSelected = item.date === selectedDate;

          return (
            <button
              key={item.date}
              type="button"
              onClick={() => onSelect(item.date)}
              aria-pressed={isSelected}
              className={`flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 text-center transition-all duration-200 sm:min-w-0 ${
                isSelected
                  ? "border-transparent bg-linear-to-br from-primary to-secondary text-white shadow-md shadow-secondary/30 ring-2 ring-secondary ring-offset-2 ring-offset-background"
                  : "border-border bg-surface text-ink hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-sm"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wide">
                {item.weekday}
              </span>
              <span className="text-lg font-bold leading-tight">{item.day}</span>
              <span className="text-xs">{item.month}</span>
              {isSelected ? (
                <Check className="mt-1.5 h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className="mt-1.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </Card>
  );
}

export default DateSelector;
