import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@/lib/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  CheckCircle2, XCircle, Clock, Loader2, QrCode,
  AlertTriangle, ClipboardList, CreditCard, ShieldCheck, Truck, Send, ArrowUpRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/game-helpers";
import { motion, AnimatePresence } from "framer-motion";

const TELEGRAM_GROUP_URL = "https://t.me/KizoTopUpCambodia";

function isPendingStatus(status: string) {
  return ["pending", "scanned"].includes(status);
}

function getKhqrMerchantName(qrString?: string | null) {
  if (!qrString) return null;

  let offset = 0;
  while (offset + 4 <= qrString.length) {
    const tag = qrString.slice(offset, offset + 2);
    const length = Number(qrString.slice(offset + 2, offset + 4));
    if (!Number.isFinite(length) || length < 0) break;

    const valueStart = offset + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > qrString.length) break;
    if (tag === "59") {
      const merchantName = qrString.slice(valueStart, valueEnd).trim();
      return merchantName || null;
    }
    offset = valueEnd;
  }

  return null;
}

function getAbaMobilePaymentLink(qrString?: string | null) {
  if (!qrString) return null;
  return `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(qrString)}`;
}

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [orderId]);

  const { data: order, isLoading, error } = useGetOrder(orderId || "", {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId || ""),
      refetchInterval: (query: { state: { data?: unknown } }) => {
        const d = query.state.data as any;
        if (!d) return false;
        if (isPendingStatus(d.paymentStatus)) return 5000;
        if ((d.paymentStatus === "paid" || d.paymentStatus === "approved") && d.orderStatus === "processing") return 6000;
        return false;
      },
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  });

  useEffect(() => {
    if (!order) return;

    const orderIsPending = isPendingStatus(order.paymentStatus);
    const abaMobilePaymentLink = getAbaMobilePaymentLink(order.qrString);
    if (!abaMobilePaymentLink || !orderIsPending || !order.id) return;

    const isMobileDevice =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isMobileDevice) return;

    const promptKey = `aba-mobile-prompted:${order.id}`;
    try {
      if (window.sessionStorage.getItem(promptKey)) return;
      window.sessionStorage.setItem(promptKey, "1");
    } catch {
      // Continue if storage is unavailable; the current page still gets one prompt.
    }

    const promptTimer = window.setTimeout(() => {
      window.location.assign(abaMobilePaymentLink);
    }, 450);

    return () => window.clearTimeout(promptTimer);
  }, [order?.id, order?.paymentStatus, order?.qrString]);

  if (error) {
    const isMissingOrder = (error as { message?: string }).message?.includes("HTTP 404");
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-3">
            {isMissingOrder ? "Order Not Found" : "Unable to Load Order"}
          </h2>
          <p className="text-muted-foreground font-medium mb-8">
            {isMissingOrder
              ? "We couldn't find this order. It may have expired or doesn't exist."
              : "The order service is temporarily unavailable. Please try again in a moment."}
          </p>
          <Link href="/"><Button className="font-display font-bold uppercase tracking-widest rounded-lg h-12 px-8">Return to Store</Button></Link>
        </div>
      </AppLayout>
    );
  }

  if (isLoading || !order) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-1 py-4 sm:py-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300/80">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-4 overflow-hidden rounded-[1.35rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5 text-center shadow-[0_12px_35px_rgba(126,49,255,0.1)] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-[0_0_25px_rgba(126,49,255,0.18)]">
              <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading order" />
            </div>
            <p className="relative mt-4 text-xs font-black uppercase tracking-[0.22em] text-white">Preparing your payment</p>
            <p className="relative mt-1.5 text-xs font-medium text-muted-foreground">Loading order details securely…</p>
            <div className="relative mx-auto mt-5 flex max-w-[220px] items-center gap-2">
              <span className="h-1.5 flex-1 animate-pulse rounded-full bg-primary/60" />
              <span className="h-1.5 w-8 rounded-full bg-white/10" />
              <span className="h-1.5 w-8 rounded-full bg-white/10" />
            </div>
          </motion.div>

          <div className="space-y-3" aria-hidden="true">
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-36" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.025] p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="mx-auto mt-5 h-32 w-32 rounded-2xl sm:h-40 sm:w-40" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = (order.paymentStatus === "paid" || order.paymentStatus === "approved") && order.orderStatus === "completed";
  const isPaymentFailed = order.paymentStatus === "failed" || order.paymentStatus === "expired";
  const isDeliveryFailed = (order.paymentStatus === "paid" || order.paymentStatus === "approved") && order.orderStatus === "failed";
  const isDeliveryProcessing = (order.paymentStatus === "paid" || order.paymentStatus === "approved") && order.orderStatus === "processing";
  const isFailed = isPaymentFailed;
  const isPending = isPendingStatus(order.paymentStatus) && !isPaymentFailed && !isCompleted;
  const merchantName = getKhqrMerchantName(order.qrString) ?? "Merchant";

  return (
    <AppLayout>
      <div className={`mx-auto max-w-lg px-1 py-2 sm:py-7 ${isCompleted ? "pt-2" : ""}`}>
        <div className="mb-2 flex items-center justify-end gap-3 sm:mb-4">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
          </div>
        </div>

        {!isCompleted && !isDeliveryFailed && (
          <OrderProgress
            paymentStatus={order.paymentStatus}
            orderStatus={order.orderStatus}
            className={isPending ? "mt-8 sm:mt-10" : ""}
          />
        )}

        <AnimatePresence mode="wait">

          {/* ─── PENDING: QR SCAN ─── */}
          {isPending && (
            <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* QR card */}
              <div className="mb-4 overflow-hidden rounded-[1.35rem] border border-primary/30 bg-gradient-to-b from-white/[0.06] to-white/[0.025] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 sm:px-5 sm:py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-white">Scan to Pay</span>
                      <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">Use any KHQR-supported banking app</span>
                    </div>
                  </div>
                  {order.expiresAt && <CountdownTimer expiresAt={order.expiresAt} />}
                </div>

                {/* QR code */}
                <div className="flex items-center justify-center px-3 py-3 sm:px-8 sm:py-8">
                  <div className="w-full max-w-[270px] overflow-hidden rounded-[1.35rem] bg-white text-slate-900 shadow-2xl shadow-black/30 sm:max-w-[310px]">
                    <div className="relative flex h-12 items-center justify-center bg-[#e72231] px-4 sm:h-16 sm:px-5">
                      <span className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">KHQR</span>
                      <div className="absolute -bottom-3 right-[-1px] h-7 w-7 rotate-45 bg-white" />
                    </div>
                    <div className="px-4 pt-3 sm:px-6 sm:pt-5">
                      <p className="text-sm font-medium text-slate-700">{merchantName}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                          {formatCurrency(order.amountUsd, order.currency as any)}
                        </span>
                        <span className="text-sm font-medium uppercase text-slate-500">{order.currency}</span>
                      </div>
                    </div>
                    <div className="mx-4 mt-3 border-t border-dashed border-slate-300 sm:mx-5 sm:mt-5" />
                    <div className="flex items-center justify-center px-3 py-3 sm:px-5 sm:py-5">
                      <div className="flex min-h-[min(52vw,180px)] min-w-[min(52vw,180px)] items-center justify-center sm:min-h-[min(68vw,224px)] sm:min-w-[min(68vw,224px)]">
                        {order.qrLink ? (
                          <img src={order.qrLink} alt="KHQR Payment" className="h-auto w-[min(52vw,180px)] object-contain sm:w-[min(68vw,224px)]" />
                        ) : order.qrString ? (
                          <QRCodeSVG value={order.qrString} size={224} className="h-auto w-[min(52vw,180px)] sm:w-[min(68vw,224px)]" level="M" />
                        ) : (
                          <div className="flex h-[min(52vw,180px)] w-[min(52vw,180px)] flex-col items-center justify-center gap-3 text-slate-500 sm:h-[min(68vw,224px)] sm:w-[min(68vw,224px)]">
                            <Loader2 className="h-8 w-8 animate-spin text-[#e72231]" />
                            <span className="text-xs font-bold uppercase tracking-widest">Generating…</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-3 gap-1.5 px-3 pb-3 sm:gap-2 sm:px-5 sm:pb-5">
                  {[
                    { n: "1", label: "Open your banking app" },
                    { n: "2", label: "Scan the QR code" },
                    { n: "3", label: "Confirm payment" },
                  ].map(({ n, label }) => (
                    <div key={n} className="flex flex-col items-center gap-1 text-center rounded-xl bg-white/4 p-1.5 sm:gap-1.5 sm:p-2.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">{n}</div>
                      <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt mini */}
              <ReceiptCard
                order={order}
              />
            </motion.div>
          )}

          {/* ─── COMPLETED ─── */}
          {isCompleted && (
            <motion.div key="completed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 pb-32 text-center sm:gap-5 sm:pb-28">
              <OrderProgress paymentStatus={order.paymentStatus} orderStatus={order.orderStatus} className="mt-8 !mb-0 sm:mt-10" />
              <div>
                <p className="khmer-font mx-auto max-w-sm text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">ការទិញរបស់អ្នកទទួលបានជោគជ័យ សូមពិនិត្យមើលគណនីហ្គេមរបស់អ្នក !</p>
              </div>

              <div className="inline-flex w-full items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Order Details</span>
              </div>
              <div className="w-full space-y-2 rounded-2xl border border-white/8 bg-white/4 p-3 sm:space-y-3 sm:p-5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground font-medium">Game</span>
                  <span className="font-bold text-white">{order.gameName}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground font-medium">Package</span>
                  <span className="font-bold text-white">{order.productName}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground font-medium">Amount</span>
                  <span className="text-sm font-black text-primary sm:text-base">{formatCurrency(order.amountUsd, order.currency as any)}</span>
                </div>
              </div>

              <Link href="/" className="w-full">
                <Button size="lg" className="h-11 w-full rounded-xl font-display text-xs font-bold uppercase tracking-widest sm:h-12 sm:text-sm">Top Up Again</Button>
              </Link>
              <a
                href={TELEGRAM_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-[4.25rem] w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-400/10 via-sky-400/5 to-primary/5 px-3 py-2.5 text-sky-300 transition-colors hover:border-sky-300/50 hover:from-sky-400/15 hover:to-primary/10 sm:px-4"
                data-testid="link-telegram-group"
                aria-label="Join our Telegram group"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10">
                  <Send className="h-4 w-4" />
                </span>
                   <span className="min-w-0 flex-1 text-center leading-tight">
                   <span className="block text-[11px] font-medium leading-4 tracking-normal text-sky-100/75 sm:text-xs">
                    Join our Telegram group for more information and discounts
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-sky-200/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          )}

          {/* ─── DELIVERING ─── */}
          {isDeliveryProcessing && (
            <motion.div key="processing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-5">
              <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div>
                <h2 className="font-display font-black text-3xl text-white mb-2">Delivering…</h2>
                <p className="text-muted-foreground">Payment confirmed. Your top up is being delivered — usually under a minute.</p>
              </div>
              <ReceiptCard order={order} showDetailsHeader />
            </motion.div>
          )}

          {/* ─── PAYMENT FAILED ─── */}
          {isFailed && (
            <motion.div key="failed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-5">
              <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <div>
                <h2 className="font-display font-black text-3xl text-white mb-2">Payment Failed</h2>
                <p className="text-muted-foreground">The payment was declined or expired. No charges were made.</p>
              </div>
              <ReceiptCard order={order} />
              <Link href="/" className="w-full">
                <Button size="lg" className="w-full h-12 font-display font-bold uppercase tracking-widest rounded-xl">Try Again</Button>
              </Link>
            </motion.div>
          )}

          {/* ─── DELIVERY FAILED ─── */}
          {isDeliveryFailed && (
              <motion.div
               key="delivery-failed"
               initial={{ opacity: 0, y: 16 }}
               animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center gap-4 pb-32 pt-4 text-center sm:gap-6 sm:pb-28 sm:pt-6"
             >
                <OrderProgress paymentStatus={order.paymentStatus} orderStatus={order.orderStatus} className="mt-8 !mb-0 sm:mt-10" />

               <div className="text-center">
                   <p className="khmer-font mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground sm:mt-3 sm:text-base sm:leading-8">
                    បានទទួលបានការទូទាត់ហើយ ប៉ុន្តែមិនអាចបញ្ចូលដោយស្វ័យប្រវត្តិបានទេ !
                 </p>
               </div>

               <ReceiptCard
                 order={order}
                 showDetailsHeader
                  compact
               />

                 <a
                   href="https://t.me/vindavit"
                   target="_blank"
                   rel="noreferrer"
                   aria-label="Contact support on Telegram"
                   data-testid="link-telegram-delivery-support-card"
                   className="group block w-full overflow-hidden rounded-[1.35rem] border border-sky-300/20 bg-gradient-to-br from-sky-400/10 to-primary/5 p-3 text-left shadow-[0_16px_40px_rgba(14,165,233,0.08)] transition-colors hover:border-sky-300/40 hover:bg-sky-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-4"
                 >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300 sm:h-10 sm:w-10">
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                   </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xs font-bold text-white sm:text-sm">Need help with this order?</p>
                      <p className="mt-0.5 max-w-prose text-[11px] leading-[1.35] text-sky-100/60 sm:mt-1 sm:text-xs sm:leading-5">
                       Message us on Telegram and include your order number so we can assist you faster.
                     </p>
                   </div>
                 </div>
                 </a>

             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function OrderProgress({
  paymentStatus,
  orderStatus,
  className = "",
}: {
  paymentStatus: string;
  orderStatus: string;
  className?: string;
}) {
  const isPaid = paymentStatus === "paid" || paymentStatus === "approved";
  const isPaymentFailed = paymentStatus === "failed" || paymentStatus === "expired";
  const isCompleted = isPaid && orderStatus === "completed";
  const isDeliveryFailed = isPaid && orderStatus === "failed";
  const activeStep = isCompleted || isDeliveryFailed ? 3 : isPaid ? 2 : 1;

  const steps = [
    { label: "Payment", icon: CreditCard },
    { label: "Receive", icon: CheckCircle2 },
    { label: "Delivered", icon: Truck },
  ];

  return (
    <div
      className={`mx-auto mb-5 w-full max-w-[22rem] rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent px-3.5 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] sm:mb-7 sm:px-5 sm:py-4 ${className}`}
      aria-label={`Order progress: ${isPaymentFailed ? "payment failed" : isDeliveryFailed ? "delivery needs attention" : steps[activeStep - 1].label}`}
    >
      <div className="relative grid grid-cols-3 items-start">
        <div className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[18px] flex items-center gap-3 sm:top-[22px] sm:gap-4">
          {steps.slice(0, 2).map((_, index) => {
            const step = index + 1;
            const connectorComplete = isCompleted || step < activeStep || (isDeliveryFailed && step < 3);
            return (
              <div
                key={`connector-${step}`}
                className={`h-0.5 min-w-0 flex-1 rounded-full ${connectorComplete ? "bg-primary/70" : "bg-white/10"}`}
              />
            );
          })}
        </div>

        {steps.map(({ label, icon: Icon }, index) => {
          const step = index + 1;
          const isError = (isPaymentFailed && step === 1) || (isDeliveryFailed && step === 3);
          const isComplete = isCompleted || step < activeStep || (isDeliveryFailed && step < 3);
          const isCurrent = !isError && !isComplete && step === activeStep;
          const isDoneOrCurrent = isComplete || isCurrent;

          return (
            <div key={label} className="relative z-10 flex min-w-0 flex-col items-center text-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors sm:h-11 sm:w-11 ${
                  isError
                    ? "border-destructive/50 bg-background text-destructive"
                    : isDoneOrCurrent
                      ? "border-primary/50 bg-background text-primary shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-background text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span
                className={`mt-2 text-[9px] font-black uppercase tracking-[0.14em] sm:text-[10px] ${
                  isError ? "text-destructive" : isDoneOrCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReceiptCard({
  order,
  showDetailsHeader = false,
  compact = false,
}: {
  order: any;
  showDetailsHeader?: boolean;
  compact?: boolean;
}) {
  const rowPadding = compact ? "px-3 py-2" : "px-4 py-3";
  const rowText = compact ? "text-xs" : "text-sm";

  return (
    <>
      {showDetailsHeader && (
        <div className="inline-flex w-full items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Order Details</span>
        </div>
      )}
      <div className="w-full divide-y divide-white/6 rounded-2xl border border-white/8 bg-white/4">
        <div className={`flex items-center justify-between ${rowPadding} text-[10px] sm:text-xs`}>
          <span className="text-muted-foreground font-medium uppercase tracking-widest">Order</span>
          <span className="font-mono font-bold text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className={`flex items-center justify-between ${rowPadding} ${rowText}`}>
          <span className="text-muted-foreground font-medium">Player ID</span>
          <span className="font-bold text-white">{order.playerIdMasked}</span>
        </div>
        {order.serverIdMasked && (
          <div className={`flex items-center justify-between ${rowPadding} ${rowText}`}>
            <span className="text-muted-foreground font-medium">Zone / Server</span>
            <span className="font-bold text-white">{order.serverIdMasked}</span>
          </div>
        )}
        <div className={`flex items-center justify-between ${rowPadding} ${rowText}`}>
          <span className="text-muted-foreground font-medium">Amount</span>
          <span className="font-black text-primary">{formatCurrency(order.amountUsd, order.currency as any)}</span>
        </div>
        <div className={`flex items-center justify-between ${rowPadding} ${rowText}`}>
          <span className="text-muted-foreground font-medium">Status</span>
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>
    </>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const update = () => setTimeLeft(Math.max(0, target - Date.now()));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const m = Math.floor(timeLeft / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  if (timeLeft <= 0) return (
    <span className="flex items-center gap-1 text-destructive text-[10px] font-bold uppercase tracking-widest">
      <Clock className="w-3 h-3" /> Expired
    </span>
  );

  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      <Clock className="w-3 h-3 text-primary" />
      <span className="font-mono text-white text-xs">{m}:{s.toString().padStart(2, "0")}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed:    "bg-destructive/10 text-destructive border-destructive/20",
    pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    processing:"bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-widest text-[10px] border ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}
