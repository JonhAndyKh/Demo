import { Sparkles } from "lucide-react";

export function LiveEventsHeading() {
  return (
    <div className="mb-5 mt-1 flex items-center gap-3 border-l-2 border-accent pl-3 sm:mb-6 sm:pl-4">
      <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent shadow-[0_0_12px_hsl(320_80%_62%_/_0.9)]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent/80">
          Updates &amp; promotions
        </p>
        <h2 className="truncate font-display text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
          New Events Live
        </h2>
      </div>
      <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
    </div>
  );
}