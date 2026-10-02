import { ReactNode } from "react";
import { Header } from "./Header";
import { Code2, Heart, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { RomdoulPetalEffect } from "@/components/RomdoulPetalEffect";
import { TelegramContactLink } from "./TelegramContactLink";

interface AppLayoutProps {
  children: ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  floatingSupporterAboveDock?: boolean;
}

export function AppLayout({
  children,
  search,
  onSearchChange,
  floatingSupporterAboveDock = false,
}: AppLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-x-clip">
      <div className="ornament-backdrop" aria-hidden="true" />
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-accent/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/6 blur-[90px]" />
      </div>
      <RomdoulPetalEffect />

      <Header search={search} onSearchChange={onSearchChange} />
      <TelegramContactLink floating moveAboveDock={floatingSupporterAboveDock} />
      <div
        aria-hidden="true"
          className="h-[68px] shrink-0 md:h-[76px]"
      />

        <main className="relative z-10 mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {children}
      </main>

      <footer className="relative z-0 mt-0 border-t border-white/8 bg-black/10 py-7 sm:mt-10 sm:py-12">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div>
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <span className="text-[11px] font-bold text-accent sm:text-xs">We Accept Payment:</span>
                <img src="/payment-methods.webp" alt="ABA and KHQR payment methods" className="h-auto w-[min(26vw,96px)] object-contain sm:w-[150px]" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground sm:text-sm">
                © {new Date().getFullYear()} <span className="font-bold text-primary">KizoTopup</span>. All rights reserved.
              </p>
            </div>

            <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <div className="flex items-center gap-2">
                <Link href="/privacy" className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/35 hover:text-white sm:px-4 sm:py-1.5 sm:text-xs">Privacy</Link>
                <Link href="/terms" className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/35 hover:text-white sm:px-4 sm:py-1.5 sm:text-xs">Terms</Link>
                <Link href="/about-us" className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/35 hover:text-white sm:px-4 sm:py-1.5 sm:text-xs">About us</Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-2.5 py-1 text-[11px] text-muted-foreground sm:px-3 sm:py-1.5 sm:text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary sm:h-6 sm:w-6"><Code2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></span>
                  <span>Developed by <strong className="ml-1 text-white">Vin Davit</strong></span>
                </div>
                <p className="flex items-center gap-1.5 text-[9px] text-muted-foreground sm:text-[10px]">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" /> Secure <Heart className="ml-1 h-3 w-3 text-accent" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
