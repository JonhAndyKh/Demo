import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, Loader2, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

interface LiveEvent {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  gameCode?: string;
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [eventId]);

  const { data: event, isLoading, isError } = useQuery<LiveEvent>({
    queryKey: ["live-event", eventId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/live-events/${encodeURIComponent(eventId || "")}`), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Live event not found");
      return response.json();
    },
    enabled: Boolean(eventId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[55vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading event" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !event) {
    return (
      <AppLayout>
        <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <Sparkles className="mb-5 h-10 w-10 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Updates &amp; Events</p>
          <h1 className="mt-2 font-display text-3xl font-black text-white">Event not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This event may have ended or is no longer available.
          </p>
          <Button
            type="button"
            onClick={() => setLocation("/")}
            className="mt-7 rounded-xl bg-primary px-6 font-display font-bold uppercase tracking-wide text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <article className="mx-auto max-w-4xl pb-8">
        <Link
          href="/"
          className="focus-ring mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to updates
        </Link>

        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-card/75 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="aspect-[1.9/1] w-full overflow-hidden bg-muted sm:aspect-[2.35/1]">
            <img
              src={event.imageUrl}
              alt={event.title || "Live event"}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-5 sm:p-8 md:p-10">
            <div className="flex items-center gap-2 text-primary">
              <CalendarDays className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Latest update</p>
            </div>
            <h1 className="mt-3 font-display text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              {event.title || "New live event"}
            </h1>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-accent/90 sm:text-base sm:leading-8">
              {event.description || "Discover the latest updates, promotions, and special events from KizoTopup."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {event.gameCode && (
                <Button
                  type="button"
                  onClick={() => setLocation(`/game/${event.gameCode}`)}
                  className="rounded-xl bg-primary px-5 font-display font-bold uppercase tracking-wide text-white"
                >
                  Top up this game
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Link
                href="/"
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:border-primary/40 hover:bg-primary/10"
              >
                See more events
              </Link>
            </div>
          </div>
        </div>
      </article>
    </AppLayout>
  );
}