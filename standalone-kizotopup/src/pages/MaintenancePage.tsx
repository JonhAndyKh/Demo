import { BrandMark } from "@/components/BrandMark";
import type { MaintenanceContent } from "@/App";
import { Activity, ArrowUpRight, Send, Wrench } from "lucide-react";

const TELEGRAM_GROUP_URL = "https://t.me/KizoTopUpCambodia";
const DEFAULT_CONTENT = {
  maintenanceStatusLabel: "Storefront update",
  maintenanceTitle: "We’re upgrading your top-up experience",
  maintenanceMessage: "KizoTopup is taking a short maintenance break while we make the store faster, smoother, and more reliable. Please check back soon.",
};
const PLACEHOLDER_COPY = new Set(["yea", "yeo", "lollppp"]);

function resolveCopy(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || PLACEHOLDER_COPY.has(trimmed.toLowerCase())) return fallback;
  return trimmed;
}

export default function MaintenancePage({ content }: { content?: Partial<MaintenanceContent> }) {
  const statusLabel = resolveCopy(content?.maintenanceStatusLabel, DEFAULT_CONTENT.maintenanceStatusLabel);
  const title = resolveCopy(content?.maintenanceTitle, DEFAULT_CONTENT.maintenanceTitle);
  const message = resolveCopy(content?.maintenanceMessage, DEFAULT_CONTENT.maintenanceMessage);

  return (
    <main
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#07111f] px-4 py-8 text-foreground sm:px-6 sm:py-12"
      aria-labelledby="maintenance-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-44 h-[32rem] w-[32rem] rounded-full bg-primary/[0.14] blur-[140px]" />
        <div className="absolute -bottom-56 -right-40 h-[34rem] w-[34rem] rounded-full bg-accent/[0.10] blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_32%),linear-gradient(180deg,rgba(6,17,31,0.05),rgba(6,13,24,0.72))]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(164,215,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(164,215,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/[0.12] to-transparent" />
      </div>

      <section className="relative w-full max-w-[42rem] overflow-hidden rounded-[1.75rem] border border-sky-100/[0.13] bg-[#0b192b]/[0.94] shadow-[0_28px_100px_rgba(1,8,19,0.58),0_10px_35px_rgba(4,26,50,0.28)] backdrop-blur-2xl sm:rounded-[2rem]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/90 to-accent/80" />
        <div className="absolute left-1/2 top-0 h-24 w-2/3 -translate-x-1/2 bg-primary/[0.13] blur-3xl" />

        <div className="relative p-5 sm:p-9">
          <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5 sm:pb-6">
            <BrandMark size="md" />
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-primary/80">
              <Activity className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              SERVICE STATUS
            </div>
          </header>

          <div className="mt-9 grid gap-7 sm:mt-11 sm:grid-cols-[6.5rem_1fr] sm:items-start sm:gap-8">
            <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-start">
              <div className="relative flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-[1.35rem] border border-primary/30 bg-gradient-to-br from-primary/[0.18] to-accent/[0.08] text-primary shadow-[0_14px_34px_rgba(7,108,172,0.2)]">
                <div className="absolute inset-2 rounded-[0.95rem] border border-primary/20" />
                <Wrench className="relative h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80 sm:mt-4">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_9px_rgba(252,211,77,0.7)]" />
                Maintenance
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/80">{statusLabel}</p>
              <h1 id="maintenance-title" className="mt-3 max-w-xl text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-[2.8rem]">
              {title}
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-sky-50/[0.58] sm:text-base sm:leading-7">{message}</p>
            </div>
          </div>

          <a
            href={TELEGRAM_GROUP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Join the KizoTopup Telegram group"
            className="group mt-9 flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.94] to-[#168cb1] px-4 py-4 text-left text-white shadow-[0_14px_30px_rgba(4,103,151,0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b192b] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-5"
            data-testid="link-join-telegram-maintenance"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Send className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold tracking-wide">Join our Telegram group</span>
                <span className="mt-0.5 block text-[11px] text-white/70">Get updates, information, and discounts</span>
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-white/75 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
          </a>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-sky-100/35">
            <span>KizoTopup service status</span>
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="h-1 w-1 rounded-full bg-primary/80" />
              Please check back soon
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}