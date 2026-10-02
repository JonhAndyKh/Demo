import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckPaywayPayment, useStartCoffeePaywayCheckout } from '@workspace/api-client-react';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Check, CircleAlert, Clock3, Coffee, LockKeyhole, RotateCw, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="Little Counter Coffee">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-emerald-950/20 bg-[#214638] text-[#f5eddd]">
        <Coffee size={18} strokeWidth={1.7} />
      </div>
      <div>
        <div className="font-display text-[17px] leading-none tracking-[-.03em]">little counter</div>
        <div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#817565]">coffee · every day</div>
      </div>
    </div>
  );
}

function CupIllustration() {
  return (
    <svg viewBox="0 0 340 320" role="img" aria-label="A freshly brewed cup of coffee" className="w-full max-w-[330px] overflow-visible">
      <ellipse cx="169" cy="281" rx="110" ry="15" fill="#1d4034" opacity=".12" />
      <path d="M110 86h133l-14 153c-1 12-12 21-24 21h-58c-12 0-22-9-24-21L110 86Z" fill="#f4e7cf" stroke="#173c30" strokeWidth="3" />
      <path d="M111 89h131l-4 36H115l-4-36Z" fill="#d2ab77" stroke="#173c30" strokeWidth="3" />
      <path d="M232 124h13c22 0 31 12 29 28-2 16-11 29-36 29" fill="none" stroke="#173c30" strokeWidth="8" strokeLinecap="round" />
      <path d="M115 131h126l-3 32H118l-3-32Z" fill="#214638" />
      <path d="M125 136h106" stroke="#f5eddd" strokeWidth="2" opacity=".72" />
      <path d="M144 192c0-13 10-23 22-23s21 10 21 23-9 22-21 22-22-9-22-22Z" fill="#d5a36d" opacity=".82" />
      <path d="M154 192c0-7 5-12 12-12s12 5 12 12-5 12-12 12-12-5-12-12Z" fill="#214638" />
      <path d="M167 181c-6 5-9 12-8 20" fill="none" stroke="#f4e7cf" strokeWidth="2" strokeLinecap="round" />
      <path d="M146 61c-14-18 12-22 0-41M184 62c-14-18 12-22 0-41M218 63c-14-18 12-22 0-41" fill="none" stroke="#c77e5e" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <path d="M89 255c20 8 40 12 81 12 41 0 61-4 81-12" fill="none" stroke="#c77e5e" strokeWidth="2" strokeDasharray="3 7" />
      <text x="176" y="231" textAnchor="middle" fill="#f5eddd" fontFamily="DM Mono, monospace" fontSize="10" letterSpacing="2">BREWED HERE</text>
      <path d="M63 105c10-16 24-25 40-27M261 91c15 5 25 17 31 32M74 208c-7 11-10 22-9 34" fill="none" stroke="#bd795a" strokeWidth="2" strokeLinecap="round" opacity=".65" />
      <circle cx="87" cy="70" r="3" fill="#bd795a" /><circle cx="276" cy="214" r="4" fill="#bd795a" /><circle cx="91" cy="241" r="2" fill="#214638" />
    </svg>
  );
}

type PaymentResult = {
  status: 'approved' | 'pending' | 'declined' | 'cancelled' | 'expired' | 'unknown';
  message: string;
};

function PaymentQrPanel({
  tranId,
  qrString,
  onCreateAnother,
}: {
  tranId: string;
  qrString: string;
  onCreateAnother: () => void;
}) {
  const payment = useCheckPaywayPayment();
  const mutateRef = useRef(payment.mutateAsync);
  mutateRef.current = payment.mutateAsync;
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setResult(null);
    setError('');
    setTimedOut(false);
    const started = Date.now();
    let finished = false;
    let busy = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const check = async () => {
      if (finished || busy) return;
      if (Date.now() - started >= 180_000) {
        finished = true;
        setChecking(false);
        setTimedOut(true);
        return;
      }
      busy = true;
      setChecking(true);
      try {
        const response = await mutateRef.current({ data: { tran_id: tranId } });
        setResult({ status: response.status, message: response.message });
        setError('');
        if (['approved', 'declined', 'cancelled', 'expired'].includes(response.status)) {
          finished = true;
          setChecking(false);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Payment status is temporarily unavailable.');
      } finally {
        busy = false;
      }
    };

    void check();
    timer = setInterval(() => { void check(); }, 5000);
    return () => {
      finished = true;
      if (timer) clearInterval(timer);
    };
  }, [tranId, retryCount]);

  const approved = result?.status === 'approved';
  const terminalFailure = result && ['declined', 'cancelled', 'expired'].includes(result.status);

  return (
    <section
      aria-live="polite"
      data-testid="panel-payment-qr"
      className="rounded-[1.5rem] border border-[#d8cdbc] bg-[#f8f3e9] px-5 py-6 text-center shadow-[0_14px_40px_rgba(58,45,30,.05)] sm:px-7"
    >
      {approved ? (
        <>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#dce7da] text-[#214638]"><Check size={24} /></div>
          <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#a55f45]">Payment confirmed</p>
          <h2 className="mt-2 font-display text-[28px] leading-tight text-[#214638]">Your coffee is ready.</h2>
          <p data-testid="status-payment-approved" className="mt-2 text-[13px] leading-6 text-[#6d6256]">ABA PayWay verified your $1.00 payment.</p>
        </>
      ) : terminalFailure || timedOut ? (
        <>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e3d8] text-[#a4553c]"><CircleAlert size={23} /></div>
          <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#a55f45]">Payment not confirmed</p>
          <h2 className="mt-2 font-display text-[28px] leading-tight text-[#214638]">{timedOut ? 'This QR has expired.' : 'Let’s try again.'}</h2>
          <p data-testid="status-payment-expired" className="mt-2 text-[13px] leading-6 text-[#6d6256]">
            {timedOut ? 'The payment session lasts three minutes. Create a new QR to try again.' : result?.message || 'PayWay did not confirm this payment.'}
          </p>
          <button type="button" onClick={onCreateAnother} className="mt-5 min-h-[46px] rounded-full bg-[#214638] px-6 text-[12px] font-semibold text-[#f7f0e3] transition-transform hover:-translate-y-0.5">
            Generate a new QR
          </button>
        </>
      ) : (
        <>
          <div className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#a55f45]">Scan with ABA PayWay</div>
          <h2 className="mt-2 font-display text-[26px] leading-tight text-[#214638]">Pay $1.00 for your coffee</h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[12px] leading-5 text-[#6d6256]">Scan this QR in your ABA app, review the amount, then approve the payment there.</p>
          <div className="mx-auto mt-5 w-fit rounded-2xl border border-[#e8e0d3] bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={qrString}
              size={220}
              level="M"
              includeMargin
              title="ABA PayWay payment QR for $1.00"
              aria-label="ABA PayWay payment QR for one dollar"
              data-testid="image-payment-qr"
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#817565]">
            {checking ? <RotateCw className="animate-spin" size={13} /> : <Clock3 size={13} />}
            {error ? 'Could not verify yet; still checking every five seconds.' : result?.status === 'pending' ? 'Waiting for payment approval…' : 'Waiting for you to approve in ABA…'}
          </div>
          {error && <p role="alert" className="mt-2 text-[11px] text-[#9a4f38]">{error}</p>}
          <div className="mt-3 font-mono-ui text-[9px] text-[#817565]">REF {tranId}</div>
          <p className="mx-auto mt-3 max-w-[320px] text-[10px] leading-4 text-[#817565]">Live payment request. The payment is only completed if you approve it in ABA.</p>
          {error && (
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-[#cfc2af] px-4 text-[11px] font-semibold text-[#214638]">
              <RotateCw size={12} /> Check again
            </button>
          )}
        </>
      )}
    </section>
  );
}

function OrderPage() {
  const checkout = useStartCoffeePaywayCheckout();
  const [error, setError] = useState('');
  const [paymentQr, setPaymentQr] = useState<{ tranId: string; qrString: string } | null>(null);

  function startCheckout() {
    setError('');
    checkout.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.success || !result.qr_string) {
          setError('We couldn’t open checkout just now. No payment was approved.');
          return;
        }
        setPaymentQr({ tranId: result.tran_id, qrString: result.qr_string });
      },
      onError: (reason) => {
        setError(reason instanceof Error ? reason.message : 'The payment counter could not be reached. Please try again.');
      },
    });
  }

  return (
    <main className="grain min-h-[100dvh] overflow-hidden bg-[#f3eddf] text-[#302820]">
      <header className="relative z-10 mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Brand />
        <div className="hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.17em] text-[#817565] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b46f51]" />
          A little neighborhood ritual
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-100px)] max-w-[1320px] grid-cols-1 items-center px-6 pb-10 md:px-12 lg:grid-cols-[1.02fr_.98fr] lg:pb-16">
        <div className="relative z-[1] order-2 pb-8 pt-5 lg:order-1 lg:pb-0 lg:pt-0">
          <div className="fade-up mb-7 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a55f45]">
            <span className="h-px w-9 bg-[#a55f45]" /> Your daily cup, made simple
          </div>
          <h1 className="fade-up max-w-[650px] font-display text-[clamp(3.5rem,8.3vw,7.3rem)] leading-[.91] tracking-[-.065em] text-[#214638]">
            Good coffee.<br />
            <span className="italic text-[#b46f51]">One dollar.</span>
          </h1>
          <p className="fade-up-delay mt-7 max-w-[430px] text-[15px] leading-[1.8] text-[#6d6256] md:text-[17px]">
            A small cup of something good, brewed fresh at our corner counter. No fuss, no extras. Just coffee.
          </p>

          <div className="mt-9 max-w-[460px] border-y border-[#d8cdbc] py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e7dece] text-[#214638]">
                  <Coffee size={19} strokeWidth={1.6} />
                </div>
                <div>
                  <div className="font-display text-[20px] tracking-[-.02em]">Fresh brewed coffee</div>
                  <div className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[#817565]">One cup · made to order</div>
                </div>
              </div>
              <div className="font-mono-ui text-[20px] tracking-[-.08em]">$1.00</div>
            </div>
          </div>

          <div className="mt-7 max-w-[460px]">
            {paymentQr ? (
              <PaymentQrPanel
                tranId={paymentQr.tranId}
                qrString={paymentQr.qrString}
                onCreateAnother={() => setPaymentQr(null)}
              />
            ) : (
              <>
                <button
                  type="button"
                  data-testid="button-buy-coffee"
                  onClick={startCheckout}
                  disabled={checkout.isPending}
                  className="group flex min-h-[58px] w-full items-center justify-between rounded-full bg-[#214638] px-7 text-[#f7f0e3] shadow-[0_8px_22px_rgba(32,66,51,.15)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#18392d] disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="flex items-center gap-3 text-[14px] font-semibold tracking-[.01em]">
                    {checkout.isPending ? <><span className="h-4 w-4 animate-pulse rounded-full border border-white/70 border-t-transparent" /> Generating payment QR…</> : 'Generate $1.00 payment QR'}
                  </span>
                  {!checkout.isPending && <ArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={19} />}
                </button>
                {error && (
                  <div role="alert" data-testid="status-checkout-error" className="mt-4 flex items-start gap-3 rounded-xl border border-[#b46f51]/35 bg-[#f7e7dc] px-4 py-3 text-[13px] leading-5 text-[#784a37]">
                    <CircleAlert className="mt-0.5 shrink-0" size={17} />
                    <div className="flex-1">{error}</div>
                    <button type="button" data-testid="button-retry-checkout" onClick={startCheckout} className="shrink-0 font-semibold underline underline-offset-4">Try again</button>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#817565]">
                  <LockKeyhole size={13} strokeWidth={1.8} />
                  Secure payment QR from ABA PayWay
                </div>
                <p className="mx-auto mt-2 max-w-[390px] text-center text-[11px] leading-5 text-[#817565]">
                  Live payment request. You approve it in ABA. The amount is 1.00; currency follows your merchant link, so confirm it is set to USD.
                </p>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center gap-3 text-[#817565]">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[#d8cdbc]"><ArrowDownRight size={15} /></span>
            <span className="font-mono-ui text-[9px] uppercase tracking-[.15em]">Made here, enjoyed nearby</span>
          </div>
        </div>

        <div className="relative order-1 flex min-h-[330px] items-center justify-center overflow-hidden md:min-h-[440px] lg:order-2 lg:min-h-[620px]">
          <div className="absolute left-1/2 top-1/2 h-[min(77vw,560px)] w-[min(77vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d6c9b4]" />
          <div className="absolute left-1/2 top-1/2 h-[min(61vw,440px)] w-[min(61vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d6c9b4]" />
          <div className="absolute left-[15%] top-[19%] font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#817565]">No. 01 / Daily brew</div>
          <div className="absolute right-[9%] top-[33%] h-2 w-2 rounded-full bg-[#b46f51]" />
          <div className="absolute bottom-[19%] left-[11%] h-1.5 w-1.5 rounded-full bg-[#214638]" />
          <div className="fade-up relative z-[1] flex w-full items-center justify-center">
            <CupIllustration />
          </div>
          <div className="absolute bottom-[8%] right-[8%] max-w-[170px] border-l border-[#b46f51] pl-3 text-[12px] leading-[1.5] text-[#817565]">
            Ground fresh.<br />Poured with care.
          </div>
        </div>
      </section>

      <footer className="relative z-[1] border-t border-[#d8cdbc] px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-2 font-mono-ui text-[9px] uppercase tracking-[.13em] text-[#8e8272] sm:flex-row">
          <span>Little Counter Coffee · A good cup for your day</span>
          <span>One freshly brewed coffee · $1.00 USD</span>
        </div>
      </footer>
    </main>
  );
}

function PaymentSuccessPage() {
  const [location, setLocation] = useLocation();
  const tranId = new URLSearchParams(location.split('?')[1] ?? '').get('tran_id') ?? '';
  const payment = useCheckPaywayPayment();
  const mutateRef = useRef(payment.mutateAsync);
  mutateRef.current = payment.mutateAsync;
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const retryCounter = useRef(0);

  useEffect(() => {
    setResult(null);
    setError('');
    setTimedOut(false);
    if (!tranId) {
      setError('We couldn’t find a transaction reference in your return from PayWay.');
      return;
    }
    const started = Date.now();
    let finished = false;
    let busy = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const check = async () => {
      if (finished || busy) return;
      if (Date.now() - started >= 180_000) {
        finished = true;
        setChecking(false);
        setTimedOut(true);
        return;
      }
      busy = true;
      setChecking(true);
      try {
        const response = await mutateRef.current({ data: { tran_id: tranId } });
        setResult({ status: response.status, message: response.message });
        setError('');
        if (response.status === 'approved' || response.status === 'declined' || response.status === 'cancelled' || response.status === 'expired') {
          finished = true;
          setChecking(false);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'We could not confirm the payment yet.');
      } finally {
        busy = false;
      }
    };

    void check();
    timer = setInterval(() => { void check(); }, 5000);
    return () => {
      finished = true;
      if (timer) clearInterval(timer);
    };
  }, [tranId, retryCounter.current]);

  const retry = () => {
    setResult(null);
    setError('');
    setTimedOut(false);
    retryCounter.current += 1;
    // Trigger a fresh verification cycle after the user explicitly retries.
    setLocation(`/payment/success?tran_id=${encodeURIComponent(tranId)}&retry=${retryCounter.current}`);
  };

  const approved = result?.status === 'approved';
  const terminalFailure = result && ['declined', 'cancelled', 'expired'].includes(result.status);

  return (
    <main className="grain flex min-h-[100dvh] flex-col bg-[#f3eddf] text-[#302820]">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Brand />
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-[#817565]">Payment return</span>
      </header>
      <section className="mx-auto flex w-full max-w-[760px] flex-1 items-center px-6 py-12">
        <div className="fade-up w-full rounded-[2rem] border border-[#d8cdbc] bg-[#f8f3e9] px-6 py-10 text-center shadow-[0_18px_60px_rgba(58,45,30,.06)] md:px-14 md:py-14">
          {approved ? (
            <>
              <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#dce7da] text-[#214638]"><Check size={34} strokeWidth={1.6} /></div>
              <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a55f45]">Payment confirmed</p>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1] tracking-[-.06em] text-[#214638]">Your coffee is on us.</h1>
              <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-7 text-[#6d6256]">Thanks for stopping by. Your $1.00 payment has been approved, and your freshly brewed cup is ready to enjoy.</p>
              <div className="mx-auto mt-8 flex max-w-[420px] items-center justify-between border-y border-[#d8cdbc] py-4 text-left">
                <div><div className="font-display text-[18px]">Fresh brewed coffee</div><div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#817565]">Transaction {tranId}</div></div>
                <span className="font-mono-ui text-[15px]">$1.00</span>
              </div>
              <div data-testid="status-payment-approved" className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[#45634d]"><ShieldCheck size={15} /> Verified with ABA PayWay</div>
            </>
          ) : terminalFailure ? (
            <>
              <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#f4e3d8] text-[#a4553c]"><CircleAlert size={32} strokeWidth={1.6} /></div>
              <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a55f45]">Payment not approved</p>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4rem)] leading-[1] tracking-[-.06em] text-[#214638]">Not quite this time.</h1>
              <p data-testid="status-payment-failed" className="mx-auto mt-5 max-w-[430px] text-[15px] leading-7 text-[#6d6256]">{result?.message || 'PayWay did not approve this payment. No coffee order was confirmed.'}</p>
              <button type="button" data-testid="button-return-order" onClick={() => setLocation('/')} className="mx-auto mt-8 flex min-h-[52px] items-center gap-3 rounded-full bg-[#214638] px-7 text-[13px] font-semibold text-[#f7f0e3] transition-transform hover:-translate-y-0.5">
                <ArrowLeft size={16} /> Return to the counter
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#e8e0d0] text-[#214638]">
                {error || timedOut ? <CircleAlert size={31} strokeWidth={1.6} /> : checking ? <RotateCw className="animate-spin" size={28} strokeWidth={1.6} /> : <Clock3 size={30} strokeWidth={1.6} />}
              </div>
              <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a55f45]">{error || timedOut ? 'Needs another look' : 'Checking with PayWay'}</p>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4rem)] leading-[1] tracking-[-.06em] text-[#214638]">{error ? 'We lost the thread.' : timedOut ? 'Still waiting.' : result?.status === 'pending' ? 'Payment is processing.' : 'Confirming your cup.'}</h1>
              <p data-testid="status-payment-pending" className="mx-auto mt-5 max-w-[440px] text-[15px] leading-7 text-[#6d6256]">
                {error ? `We couldn’t verify your payment: ${error}` : timedOut ? 'PayWay has not sent a final confirmation yet. Check again in a moment, or come back to the order counter.' : result?.message || 'We’re asking ABA PayWay to confirm the transaction. This page checks again every five seconds; it can take a little while.'}
              </p>
              <div className="mt-7 flex items-center justify-center gap-2 font-mono-ui text-[10px] tracking-[.04em] text-[#817565]"><span className="text-[#a55f45]">REF</span> {tranId || 'not available'}</div>
              {(error || timedOut || !tranId) && (
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  {tranId && <button type="button" data-testid="button-retry-status" onClick={retry} className="flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#214638] px-6 text-[13px] font-semibold text-[#f7f0e3] transition-transform hover:-translate-y-0.5"><RotateCw size={15} /> Check payment again</button>}
                  <button type="button" data-testid="button-return-order" onClick={() => setLocation('/')} className="flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-[#cfc2af] px-6 text-[13px] font-semibold text-[#214638] transition-colors hover:bg-[#eee6d8]"><ArrowLeft size={15} /> Return to order</button>
                </div>
              )}
              {!error && !timedOut && !tranId && <button type="button" data-testid="button-return-order" onClick={() => setLocation('/')} className="mt-8 rounded-full bg-[#214638] px-7 py-4 text-[13px] font-semibold text-[#f7f0e3]">Return to order</button>}
            </>
          )}
          <div className="mt-10 border-t border-[#e0d7c8] pt-5 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#8e8272]">Little Counter Coffee · ABA PayWay hosted payment</div>
        </div>
      </section>
    </main>
  );
}

function CancelledPage() {
  const [location, setLocation] = useLocation();
  const tranId = new URLSearchParams(location.split('?')[1] ?? '').get('tran_id');
  return (
    <main className="grain flex min-h-[100dvh] flex-col bg-[#f3eddf] text-[#302820]">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Brand />
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-[#817565]">Checkout return</span>
      </header>
      <section className="mx-auto flex w-full max-w-[760px] flex-1 items-center px-6 py-12">
        <div className="fade-up w-full rounded-[2rem] border border-[#d8cdbc] bg-[#f8f3e9] px-6 py-10 text-center shadow-[0_18px_60px_rgba(58,45,30,.06)] md:px-14 md:py-14">
          <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#eee5d7] text-[#a55f45]"><ArrowDownRight size={31} strokeWidth={1.6} /></div>
          <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a55f45]">Checkout not confirmed</p>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.2rem)] leading-[1] tracking-[-.06em] text-[#214638]">We saved your seat.</h1>
          <p data-testid="status-checkout-cancelled" className="mx-auto mt-5 max-w-[440px] text-[15px] leading-7 text-[#6d6256]">Checkout was cancelled or expired before this shop received a verified approval. If PayWay shows your payment as completed, don’t pay again; contact the shop with your transaction reference.</p>
          {tranId && <p className="mt-5 font-mono-ui text-[10px] text-[#817565]">REF {tranId}</p>}
          <button type="button" data-testid="button-return-order" onClick={() => setLocation('/')} className="group mx-auto mt-8 flex min-h-[54px] items-center gap-3 rounded-full bg-[#214638] px-7 text-[13px] font-semibold text-[#f7f0e3] transition-transform hover:-translate-y-0.5">
            <ArrowLeft size={16} /> Back to the counter <ArrowUpRight className="ml-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} />
          </button>
          <div className="mt-10 border-t border-[#e0d7c8] pt-5 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#8e8272]">No pressure. Good coffee will wait.</div>
        </div>
      </section>
    </main>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={OrderPage} />
        <Route path="/payment/success" component={PaymentSuccessPage} />
        <Route path="/payment/cancelled" component={CancelledPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;