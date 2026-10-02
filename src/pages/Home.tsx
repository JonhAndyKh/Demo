import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useListGames } from "@/lib/api-client-react";
import { Clock3, ChevronDown, SearchX, ShieldCheck, WalletCards, Zap, Sword, Star, ArrowRight, Bookmark } from "lucide-react";
import { generateGamePlaceholder } from "@/lib/utils/game-helpers";
import { AppLayout } from "@/components/layout/AppLayout";
import { PromoCarousel } from "@/components/PromoCarousel";
import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { LiveEventsCarousel } from "@/components/LiveEventsCarousel";
import { motion, AnimatePresence } from "framer-motion";

export default function Storefront() {
  const { data: games, isLoading, error } = useListGames();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const filteredGames = useMemo(() => {
    if (!games) return [];
    return games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [games, search]);
  const featuredGames = filteredGames.filter((game) => game.isPinned);
  const visibleGames = filteredGames;

  return (
    <AppLayout search={search} onSearchChange={setSearch}>
      <PromoCarousel />
      <AnnouncementTicker />

       {featuredGames.length > 0 && (
         <section
           className="mb-7 lg:mb-10 lg:rounded-[2rem] lg:border lg:border-white/10 lg:bg-[linear-gradient(135deg,rgba(13,28,48,0.86),rgba(7,16,29,0.72))] lg:p-6 lg:shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
           aria-labelledby="featured-games-heading"
         >
           <div className="mb-4 flex items-end justify-between gap-3 px-1 lg:mb-6">
             <div>
               <div className="mb-1 flex items-center gap-2 text-primary">
                 <Star className="h-4 w-4 fill-current" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] lg:text-xs">Featured selection</p>
               </div>
                <h1 id="featured-games-heading" className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                 Featured Games
               </h1>
                <p className="mt-1 text-xs text-muted-foreground lg:text-sm">Top trending games with instant top-up</p>
             </div>
              <span className="hidden rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary lg:inline-flex">
                Play more. Wait less.
              </span>
           </div>
            <motion.div layout className="grid grid-cols-2 gap-3 lg:gap-5">
             <AnimatePresence>
               {featuredGames.map((game, i) => (
                 <FeaturedGameCard
                   key={game.gameCode}
                   game={game}
                   index={i}
                   onSelect={() => setLocation(`/game/${game.gameCode}`)}
                 />
               ))}
             </AnimatePresence>
           </motion.div>
         </section>
       )}

        <section
          id="all-games"
          className="mb-7 lg:mb-10 lg:rounded-[2rem] lg:border lg:border-white/10 lg:bg-black/10 lg:p-6"
          aria-labelledby="games-heading"
        >
            <div className="mb-4 flex items-end justify-between gap-3 px-1 lg:mb-6">
            <div>
               {featuredGames.length > 0 ? (
                 <div className="mb-1 flex items-center gap-2 text-accent">
                   <Bookmark className="h-4 w-4 fill-current" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] lg:text-xs">Catalogue</p>
                 </div>
               ) : (
                 <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">KizoTopup</p>
               )}
                <h1 id="games-heading" className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                 {featuredGames.length > 0 ? "All Games" : "Top Up All Games"}
               </h1>
                <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
                 {featuredGames.length > 0 ? "Browse all available games" : "Choose the game you want to top up"}
               </p>
            </div>
              {!isLoading && !error ? (
               <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                 {filteredGames.length} available
               </span>
              ) : null}
          </div>

          {isLoading && !error && (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-x-5 lg:gap-y-6" role="status" aria-label="Loading games">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="aspect-square animate-pulse rounded-xl border border-white/10 bg-white/[0.06]" />
                  <div className="h-3 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Sword className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display font-bold text-white">Failed to load games</p>
                <p className="mt-1 text-xs text-muted-foreground">Please try refreshing the page.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredGames.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No games found for “{search}”.</p>
            </div>
          )}

           {!isLoading && !error && filteredGames.length > 0 && (
             <motion.div layout className="grid grid-cols-3 justify-items-center gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-x-5 lg:gap-y-6">
               <AnimatePresence>
                 {visibleGames.map((game, i) => (
                   <GameCard
                     key={game.gameCode}
                     game={game}
                     index={i}
                     onSelect={() => setLocation(`/game/${game.gameCode}`)}
                   />
                 ))}
               </AnimatePresence>
             </motion.div>
           )}

      </section>

       <LiveEventsCarousel />
      <WhyChooseSection />
      <QuestionsSection />
    </AppLayout>
  );
}

function WhyChooseSection() {
  const benefits = [
    {
      icon: Zap,
      title: "Fast Top-Up",
      text: "Instant delivery for all games with zero waiting.",
    },
    {
      icon: ShieldCheck,
      title: "Safe Payment",
      text: "Secure transactions guaranteed with advanced protection.",
    },
    {
      icon: WalletCards,
      title: "Best Price Guarantee",
      text: "Affordable game recharge deals with competitive prices.",
    },
    {
      icon: Clock3,
      title: "24/7 Support",
      text: "Always here to help players with dedicated customer care.",
    },
  ];

  return (
    <section className="mb-8" aria-labelledby="why-choose-heading">
      <div className="mb-4 px-1">
        <h2 id="why-choose-heading" className="font-display text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
          Why Choose KizoTopup
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Enjoy a faster, safer, and more reliable game top-up experience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
           className="surface group flex min-h-[76px] items-center gap-2 rounded-2xl p-2 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card sm:min-h-[96px] sm:gap-3 sm:p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-primary shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition group-hover:border-primary/35 group-hover:bg-primary/10 sm:h-12 sm:w-12">
              <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xs font-bold text-white sm:text-sm">{title}</h3>
              <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground sm:text-[10px]">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuestionsSection() {
  const questions = [
    {
      question: "តើការបញ្ចូលលុយហ្គេមចំណាយពេលប៉ុន្មានទើបចូលគណនី?",
      answer:
        "ការបញ្ជាទិញភាគច្រើនត្រូវបានដំណើរការដោយស្វ័យប្រវត្តិ និងចូលទៅក្នុងគណនីក្នុងរយៈពេលប៉ុន្មានវិនាទីប៉ុណ្ណោះ បន្ទាប់ពីការទូទាត់ត្រូវបានបញ្ជាក់ ដំណើរការ 24 ម៉ោងមិនឈប់ឈរ។",
    },
    {
      question: "តើខ្ញុំត្រូវចូល (Login) គណនីហ្គេមរបស់ខ្ញុំដែរឬទេ?",
      answer:
        "មិនបាច់នោះទេ ការបញ្ចូលទឹកប្រាក់ភាគច្រើនទាមទារតែ Player ID និង Zone ID របស់អ្នកតែប៉ុណ្ណោះ។ យើងខ្ញុំមិនសួររកលេខសម្ងាត់គណនីរបស់អ្នកឡើយ។",
    },
    {
      question: "ចុះបើទំនិញ ឬកាក់ហ្គេមមិនទាន់ចូលក្នុងគណនីរបស់ខ្ញុំ?",
      answer:
        "សូមរង់ចាំរយៈពេល 5 ទៅ 10 នាទីក្នុងអំឡុងពេលដែលមានអ្នកប្រើប្រាស់ច្រើន។ ប្រសិនបើនៅតែមិនទាន់ចូល សូមទាក់ទងមកកាន់ផ្នែកគាំទ្រអតិថិជនរបស់យើងជាមួយ Order ID របស់អ្នក។",
    },
    {
      question: "តើការធ្វើប្រតិបត្តិការទិញដូរនៅលើទីនេះមានសុវត្ថិភាពដែរឬទេ?",
      answer:
        "ពិតជាមានសុវត្ថិភាព 100%។ រាល់ប្រតិបត្តិការទាំងអស់ត្រូវបានប្រើប្រាស់ប្រព័ន្ធកូដនីយកម្ម SSL កម្រិតខ្ពស់ និងច្រកទូទាត់ផ្លូវការដើម្បីការពារព័ត៌មានហិរញ្ញវត្ថុរបស់អ្នក។",
    },
  ];
  const [openQuestion, setOpenQuestion] = useState(0);

  return (
    <section className="mb-4" aria-labelledby="questions-heading">
      <div className="mb-5 px-1">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent sm:text-xs">
          Questions about this page
        </p>
        <h2 id="questions-heading" className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
          Questions about KizoTopup
        </h2>
      </div>

      <div className="space-y-2.5">
        {questions.map((item, index) => {
          const isOpen = openQuestion === index;

          return (
            <div key={item.question} className="overflow-hidden rounded-2xl border border-white/10 bg-card/75">
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-white/[0.035] sm:px-7"
              >
                 <span className="khmer-font text-sm leading-relaxed text-slate-200 sm:text-[15px]">{item.question}</span>
                 <ChevronDown className={`h-6 w-6 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-accent" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-white/8 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
                   <p className="khmer-font max-w-4xl text-xs leading-6 text-muted-foreground sm:text-sm">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GameCard({ game, index, onSelect }: { game: any; index: number; onSelect: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.2) }}
      className="group flex w-full max-w-[220px] cursor-pointer flex-col gap-2 lg:max-w-none lg:gap-2.5"
      data-testid={`card-game-${game.gameCode}`}
      onClick={onSelect}
    >
      <div className="card-glow relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_8px_22px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover:-translate-y-0.5 lg:rounded-[1.35rem] lg:border-white/12 lg:shadow-[0_16px_32px_rgba(0,0,0,0.24)]">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${generateGamePlaceholder(game.gameCode)}`} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <p className="absolute bottom-2 left-0 right-0 px-2 text-center font-display text-[10px] font-semibold leading-tight text-white drop-shadow sm:text-[11px]">
          {game.name}
        </p>
      </div>
      <button
        className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary lg:rounded-xl lg:border-white/12 lg:bg-white/[0.035] lg:py-3 lg:text-[11px]"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        Top Up
      </button>
    </motion.div>
  );
}

function FeaturedGameCard({ game, index, onSelect }: { game: any; index: number; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
      onClick={onSelect}
      className="group flex min-h-[92px] w-full items-center gap-1.5 rounded-2xl border border-white/10 bg-card/75 p-2 text-left shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card min-[420px]:gap-2 min-[420px]:p-2.5 sm:min-h-[144px] sm:gap-3 sm:p-3 lg:min-h-[176px] lg:gap-4 lg:rounded-[1.35rem] lg:border-white/12 lg:bg-white/[0.035] lg:p-5 lg:shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
      data-testid={`card-featured-game-${game.gameCode}`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] min-[420px]:h-16 min-[420px]:w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32">
        {game.imageUrl ? (
          <img src={game.imageUrl} alt={game.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${generateGamePlaceholder(game.gameCode)}`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 font-display text-[11px] font-bold leading-tight text-white min-[420px]:text-sm sm:text-xl lg:text-[21px]">{game.name}</h2>
        <p className="mt-1 text-[9px] text-muted-foreground min-[420px]:text-[10px] sm:text-sm lg:text-[13px]">Top up and play!</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-primary sm:mt-2 sm:text-xs lg:mt-3 lg:text-[11px]">
          Top up now <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.button>
  );
}