import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Slide {
  _id: string;
  imageUrl: string;
}

const EMPTY_SLIDES: Slide[] = [];

interface PromoCarouselProps {
  onGameSelect?: (gameCode: string) => void;
}

export function PromoCarousel({ onGameSelect: _ }: PromoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [failedSlideIds, setFailedSlideIds] = useState<Set<string>>(new Set());
  const [readySlideIds, setReadySlideIds] = useState<Set<string>>(new Set());

  const { data: slidesData, isLoading } = useQuery<Slide[]>({
    queryKey: ["promo-slides"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/slides/active"), { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load slides (${response.status})`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid slides response");
      return data.filter((slide): slide is Slide =>
        typeof slide === "object" &&
        slide !== null &&
        typeof (slide as Slide)._id === "string" &&
        typeof (slide as Slide).imageUrl === "string" &&
        (slide as Slide).imageUrl.length > 0,
      );
    },
    staleTime: 60_000,
    retry: 3,
    refetchOnMount: "always",
    // Slides are managed content, not live state. Background polling caused
    // transient image revalidation failures to blank the whole carousel.
    // Load them once per page visit and keep the rendered banner stable.
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
  const slides = slidesData ?? EMPTY_SLIDES;

  useEffect(() => {
    let active = true;
    const nextReady = new Set<string>();

    const activeSlideIds = new Set(slides.map((slide) => slide._id));
    setFailedSlideIds((failed) => {
      const next = new Set([...failed].filter((id) => activeSlideIds.has(id)));
      if (next.size === failed.size && [...next].every((id) => failed.has(id))) return failed;
      return next;
    });

    for (const slide of slides) {
      const image = new Image();
      image.onload = () => {
        if (!active) return;
        nextReady.add(slide._id);
        setReadySlideIds(new Set(nextReady));
      };
      image.onerror = () => {
        if (!active) return;
        setFailedSlideIds((failed) => {
          if (failed.has(slide._id)) return failed;
          return new Set(failed).add(slide._id);
        });
      };
      image.src = slide.imageUrl;
    }

    return () => {
      active = false;
    };
  }, [slides]);

  const visibleSlides = slides.filter(
    (slide) => readySlideIds.has(slide._id) && !failedSlideIds.has(slide._id),
  );

  useEffect(() => {
    setCurrent((selected) => visibleSlides.length > 0 ? selected % visibleSlides.length : 0);
  }, [visibleSlides.length]);

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const t = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % visibleSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [visibleSlides.length]);

  const loadingImages =
    slides.length > 0 &&
    visibleSlides.length === 0 &&
    failedSlideIds.size < slides.length;

  if (isLoading || loadingImages) {
    return null;
  }
  if (visibleSlides.length === 0) return null;

  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + visibleSlides.length) % visibleSlides.length); };
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % visibleSlides.length); };
  const slide = visibleSlides[current]!;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="group relative mb-8 w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.24)] lg:mb-10 lg:rounded-[1.75rem]"
      style={{ aspectRatio: "16/6", maxHeight: 380 }}
    >
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={slide._id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0"
        >
           <img
             src={slide.imageUrl}
             alt=""
             className="absolute inset-0 w-full h-full object-cover"
             onError={() => setFailedSlideIds((failed) => {
               if (failed.has(slide._id)) return failed;
               return new Set(failed).add(slide._id);
             })}
           />
          {/* Subtle bottom fade into page */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

       {/* Prev / Next */}
       {visibleSlides.length > 1 && (
         <>
           <button
             onClick={prev}
             aria-label="Previous slide"
             className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/70 group-hover:opacity-100"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button
             onClick={next}
             aria-label="Next slide"
             className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/70 group-hover:opacity-100"
           >
             <ChevronRight className="w-4 h-4" />
           </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
             {visibleSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-1.5 transition-all duration-300 rounded-full ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
