import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function LegalPageLayout({
  title,
  eyebrow,
  boxed = true,
  meta = "Last updated: June 26, 2026",
  showFooterLinks = true,
  children,
}: {
  title: string;
  eyebrow: string;
  boxed?: boolean;
  meta?: string;
  showFooterLinks?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background bg-dot-grid px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <BrandMark size="sm" />
          </Link>
          <Link
            href="/"
            aria-label="Back"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back
          </Link>
        </div>

        <article className={`mt-8 ${boxed ? "rounded-3xl border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/10 sm:p-9" : "px-1 sm:px-3"}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
          <div className="legal-copy mt-8 text-sm leading-7 text-muted-foreground">{children}</div>
        </article>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> KizoTopup
          {showFooterLinks && (
            <>
              <span>·</span>
              <Link href="/privacy" className="hover:text-primary">Privacy</Link>
              <span>·</span>
              <Link href="/track-order" className="hover:text-primary">Track order</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-primary">Terms</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">{children}</ul>;
}