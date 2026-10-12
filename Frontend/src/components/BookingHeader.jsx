import { GraduationCap, Sparkles } from "lucide-react";
import PageContainer from "./PageContainer.jsx";

function BookingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <PageContainer className="py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30 sm:h-10 sm:w-10">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-ink sm:text-base">
                Booking Demo Class
              </p>
              <p className="truncate text-xs text-muted">
                Book a free demo class for your child
              </p>
            </div>
          </div>

          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-teal-brand sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            100% Free
          </span>
        </div>
      </PageContainer>
    </header>
  );
}

export default BookingHeader;
