import { FormEvent, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LegalPageLayout } from "./LegalPage";

export default function TrackOrderPage() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId) return;
    setLocation(`/order/${encodeURIComponent(trimmedOrderId)}`);
  };

  return (
    <LegalPageLayout
      title="Track your order"
      eyebrow="KizoTopup order tracking"
      meta="Check your payment and delivery status"
      showFooterLinks={false}
    >
      <p>
        Enter the order ID from your payment or confirmation screen to view your payment progress and top-up delivery status.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 border-t border-white/10 pt-6">
        <label htmlFor="order-id" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Order ID
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="order-id"
              type="text"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Paste your order ID"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20"
              data-testid="input-track-order-id"
            />
          </div>
          <Button
            type="submit"
            disabled={!orderId.trim()}
            className="h-11 rounded-xl px-5 font-display text-xs font-bold uppercase tracking-widest"
            data-testid="button-track-order"
          >
            Track order <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="mt-8 border-l border-primary/30 pl-4 text-xs leading-6 text-muted-foreground">
        <p className="font-bold text-white">Can’t find your order ID?</p>
        <p className="mt-1">
          Open your payment confirmation or contact us on{" "}
          <a className="font-bold text-primary hover:underline" href="https://t.me/vindavit" target="_blank" rel="noreferrer">
            Telegram
          </a>{" "}
          with your payment details.
        </p>
      </div>
    </LegalPageLayout>
  );
}