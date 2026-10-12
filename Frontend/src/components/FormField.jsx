import { cloneElement, isValidElement } from "react";
import { AlertCircle } from "lucide-react";

// Shared input styling. Border + focus ring colours are supplied by FormField
// (valid vs. error) so the two states never conflict.
export const inputClassName =
  "h-11 w-full rounded-xl border bg-surface px-3.5 text-base text-ink shadow-sm shadow-slate-200/50 outline-none transition placeholder:text-muted focus:ring-4 disabled:cursor-not-allowed disabled:bg-background sm:text-sm";

const validControl = "border-border focus:border-secondary focus:ring-secondary/15";
const invalidControl = "border-error focus:border-error focus:ring-error/15";

function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
  className = "",
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  // Wire up accessibility (id + aria) on the control we are given.
  let control = children;
  if (isValidElement(children)) {
    control = cloneElement(children, {
      id,
      "aria-invalid": error ? "true" : undefined,
      "aria-describedby": describedBy,
      className: `${children.props.className ?? ""} ${
        error ? invalidControl : validControl
      }`.trim(),
    });
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {control}

      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-error"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
