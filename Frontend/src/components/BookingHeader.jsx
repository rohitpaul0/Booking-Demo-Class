import { GraduationCap, Sparkles } from "lucide-react";
import PageContainer from "./PageContainer.jsx";

function BookingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <PageContainer className="py-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold leading-tight text-ink sm:text-lg">
                Booking Demo Class
              </p>
              <p className="text-xs text-muted sm:text-sm">
                Find a convenient time for your child&apos;s demo class
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-teal-brand sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            100% Free
          </span>
        </div>
      </PageContainer>
    </header>
  );
}

export default BookingHeader;
