import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { apiUrl } from "@/lib/api";

interface LiveEvent {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  gameCode?: string;
}

const EMPTY_EVENTS: LiveEvent[] = [];

export function LiveEventsCarousel() {
  const [, setLocation] = useLocation();
  const [start, setStart] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [readyImageIds, setReadyImageIds] = useState<Set<string>>(new Set());
  const { data: eventsData, isLoading } = useQuery<LiveEvent[]>({
    queryKey: ["live-events"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/live-events/active"), { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load live events");
      const data: unknown = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const events = eventsData ?? EMPTY_EVENTS;

  useEffect(() => {
    let active = true;
    const eventIds = new Set(events.map((event) => event._id));

    setFailedImages((current) => new Set([...current].filter((id) => eventIds.has(id))));
    setReadyImageIds((current) => new Set([...current].filter((id) => eventIds.has(id))));

    for (const event of events) {
      const image = new Image();
      image.onload = () => {
        if (!active) return;
        setReadyImageIds((current) => new Set(current).add(event._id));
      };
      image.onerror = () => {
        if (!active) return;
        setFailedImages((current) => new Set(current).add(event._id));
      };
      image.src = event.imageUrl;
    }

    return () => {
      active = false;
    };
  }, [events]);

  const visibleEvents = events.filter(
    (event) => readyImageIds.has(event._id) && !failedImages.has(event._id),
  );
  const eventIds = visibleEvents.map((event) => event._id).join(",");

  useEffect(() => {
    setStart(0);
    setTransitionEnabled(true);
  }, [eventIds, visibleEvents.length]);

  useEffect(() => {
    if (visibleEvents.length < 2) return;
    const timer = window.setInterval(() => {
      setStart((current) => current + 1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [eventIds, visibleEvents.length]);

  useEffect(() => {
    if (start !== visibleEvents.length) return;
    const resetTimer = window.setTimeout(() => {
      setTransitionEnabled(false);
      setStart(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setTransitionEnabled(true));
      });
    }, 720);
    return () => window.clearTimeout(resetTimer);
  }, [start, visibleEvents.length]);

  if (isLoading) return null;
  if (visibleEvents.length === 0) return null;

  const move = (amount: number) => {
    setTransitionEnabled(true);
    setStart((current) => Math.max(0, Math.min(current + amount, visibleEvents.length - 1)));
  };
  const carouselEvents = [...visibleEvents, ...visibleEvents];

  return (
    <motion.section
      id="live-events"
      className="mb-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <span className="text-lg sm:text-xl">🎉</span>
            <h2 className="truncate font-display text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              Updates &amp; Events
            </h2>
            <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-accent sm:text-base">
            <span aria-hidden="true">◷</span>
            Latest updates, promotions, and special events
          </p>
        </div>
        {visibleEvents.length > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => move(-1)}
              aria-label="Previous live event"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/60 bg-accent/10 text-white transition hover:border-primary hover:bg-accent/30 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => move(1)}
              aria-label="Next live event"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/60 bg-accent/10 text-white transition hover:border-primary hover:bg-accent/30 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="scrollbar-hide overflow-hidden">
        <div
          className={`live-events-track flex gap-3 sm:gap-4 ${transitionEnabled ? "transition-transform duration-1000 ease-out" : ""}`}
          style={{ "--event-start": start } as CSSProperties}
        >
          {carouselEvents.map((event, index) => (
            <article key={`${event._id}-${index}`} className="relative w-[84vw] min-w-0 shrink-0 overflow-hidden sm:w-[58vw] md:w-[42vw] lg:w-[34vw]">
              <button
                type="button"
                onClick={() => setLocation(`/event/${event._id}`)}
                aria-label={`Read ${event.title || "live event"}`}
                className="group block w-full text-left"
              >
                <div className="aspect-[1.9/1] w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-muted">
                  <img
                    src={event.imageUrl}
                    alt={event.title || "Live event"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setFailedImages((current) => new Set(current).add(event._id))}
                  />
                </div>
                <h3 className="mt-4 line-clamp-2 font-display text-lg font-bold leading-tight text-white transition-colors group-hover:text-primary sm:text-xl">
                  {event.title || "New live event"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-accent/85 sm:text-base">
                  {event.description || "Discover the latest updates, promotions, and special events from KizoTopup."}
                </p>
              </button>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}