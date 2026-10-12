import { Check } from "lucide-react";

function StepIndicator({ steps, currentStep }) {
  return (
    <ol
      className="flex items-center gap-2 sm:gap-3"
      aria-label="Booking progress"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                isComplete
                  ? "bg-teal-brand text-white"
                  : isActive
                  ? "bg-linear-to-br from-primary to-secondary text-white shadow-sm shadow-secondary/30 ring-4 ring-lavender"
                  : "border border-border bg-surface text-muted"
              }`}
              aria-hidden="true"
            >
              {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
            </span>

            <span
              className={`min-w-0 truncate text-xs sm:text-sm ${
                isActive
                  ? "block font-semibold text-ink"
                  : "hidden font-medium text-muted sm:block"
              } ${isComplete ? "sm:font-medium sm:text-ink" : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              {step}
            </span>

            {index < steps.length - 1 && (
              <span
                className={`h-0.5 min-w-4 flex-1 rounded-full ${
                  isComplete ? "bg-teal-brand/50" : "bg-border"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default StepIndicator;
