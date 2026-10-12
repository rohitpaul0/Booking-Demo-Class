import { CalendarDays, Check } from "lucide-react";
import Card from "./Card.jsx";

function DateSelector({ dates, selectedDate, onSelect, error }) {
  return (
    <Card className="space-y-4 sm:space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary sm:h-10 sm:w-10">
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
        className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-7"
      >
        {dates.map((item) => {
          const isSelected = item.date === selectedDate;

          return (
            <button
              key={item.date}
              type="button"
              onClick={() => onSelect(item.date)}
              aria-pressed={isSelected}
              className={`flex min-w-0 flex-col items-center rounded-xl border px-1.5 py-2.5 text-center transition-all duration-200 ${
                isSelected
                  ? "border-transparent bg-linear-to-br from-primary to-secondary text-white shadow-md shadow-secondary/30 ring-2 ring-secondary ring-offset-2 ring-offset-background"
                  : "border-border bg-surface text-ink hover:border-secondary/40 hover:bg-lavender active:bg-violet"
              }`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide sm:text-xs">
                {item.weekday}
              </span>
              <span className="text-base font-bold leading-tight sm:text-lg">
                {item.day}
              </span>
              <span className="text-[10px] sm:text-xs">{item.month}</span>
              {isSelected ? (
                <Check className="mt-1 h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className="mt-1 h-3.5" aria-hidden="true" />
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
