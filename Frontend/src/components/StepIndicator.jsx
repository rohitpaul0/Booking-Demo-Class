import { Check } from "lucide-react";

function StepIndicator({ steps, currentStep }) {
  return (
    <ol
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3"
      aria-label="Booking progress"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li key={step} className="flex flex-1 items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                isComplete
                  ? "bg-teal-brand text-white"
                  : isActive
                  ? "bg-linear-to-br from-primary to-secondary text-white shadow-md shadow-secondary/30 ring-4 ring-lavender"
                  : "border border-border bg-surface text-muted"
              }`}
              aria-hidden="true"
            >
              {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
            </span>

            <span
              className={`text-sm ${
                isActive
                  ? "font-semibold text-ink"
                  : isComplete
                  ? "font-medium text-ink"
                  : "text-muted"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {step}
            </span>

            {index < steps.length - 1 && (
              <span
                className={`ml-auto hidden h-0.5 flex-1 rounded-full sm:block ${
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
