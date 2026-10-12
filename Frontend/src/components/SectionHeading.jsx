import { Sparkles } from "lucide-react";

function SectionHeading({ eyebrow, title, description, className = "" }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-lavender px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
