import { Users } from "lucide-react";
import Card from "./Card.jsx";
import FormField, { inputClassName } from "./FormField.jsx";
import { getTimeZoneOptions } from "../utils/timezone.js";

function BookingForm({
  values,
  errors,
  onChange,
  timeZone,
  onTimeZoneChange,
}) {
  const timeZoneOptions = getTimeZoneOptions(timeZone);

  return (
    <Card>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">
            Parent &amp; student details
          </h3>
          <p className="text-sm text-muted">
            We only ask for what is needed to arrange the demo class.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="parentName"
          label="Parent full name"
          required
          error={errors.parentName}
        >
          <input
            type="text"
            name="parentName"
            value={values.parentName}
            onChange={(event) => onChange("parentName", event.target.value)}
            placeholder="e.g. Priya Sharma"
            autoComplete="name"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="parentEmail"
          label="Parent email address"
          required
          error={errors.parentEmail}
          hint="We will send the demo class details here."
        >
          <input
            type="email"
            name="parentEmail"
            value={values.parentEmail}
            onChange={(event) => onChange("parentEmail", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="studentName"
          label="Student name"
          required
          error={errors.studentName}
          className="sm:col-span-2"
        >
          <input
            type="text"
            name="studentName"
            value={values.studentName}
            onChange={(event) => onChange("studentName", event.target.value)}
            placeholder="e.g. Aarav Sharma"
            autoComplete="off"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="parentTimeZone"
          label="Your time zone"
          hint="Class times are shown in this time zone. Change it if needed."
          className="sm:col-span-2"
        >
          <select
            name="parentTimeZone"
            value={timeZone}
            onChange={(event) => onTimeZoneChange(event.target.value)}
            className={inputClassName}
          >
            {timeZoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Card>
  );
}

export default BookingForm;
