import { Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";

const TELEGRAM_URL = "https://t.me/vindavit";
const TELEGRAM_SUPPORTER_ALERT_EVENT = "telegram-supporter-alert";
const DEFAULT_SUPPORTER_SETTINGS = {
  supporterEnabled: true,
  supporterMessage: "Need help with your top-up? Chat with us on Telegram.",
  supporterInitialDelaySeconds: 5,
  supporterTalkDurationSeconds: 5,
  supporterPauseDurationSeconds: 15,
};

interface SupporterSettings {
  supporterEnabled: boolean;
  supporterMessage: string;
  supporterInitialDelaySeconds: number;
  supporterTalkDurationSeconds: number;
  supporterPauseDurationSeconds: number;
}

function getSupporterMessages(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((message) => message.trim())
    .filter(Boolean);
}

export function notifyTelegramSupporter(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TELEGRAM_SUPPORTER_ALERT_EVENT, {
        detail: { message },
      }),
    );
  }
}

export function buildTelegramCheckUserUrl({
  gameName,
  gameCode,
  playerId,
  serverId,
  serverFieldLabel,
}: {
  gameName?: string;
  gameCode?: string | null;
  playerId: string;
  serverId?: string;
  serverFieldLabel?: string;
}) {
  const lines = [
    "Please check my username.",
    `Game: ${gameName || gameCode || "Unknown"}`,
    `Player ID: ${playerId.trim()}`,
  ];
  if (serverId?.trim()) {
    lines.push(`${serverFieldLabel || "Server ID"}: ${serverId.trim()}`);
  }
  return `${TELEGRAM_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function TelegramCheckUserLink({
  gameName,
  gameCode,
  playerId,
  serverId,
  requiresServer = false,
  serverFieldLabel,
}: {
  gameName?: string;
  gameCode?: string | null;
  playerId: string;
  serverId?: string;
  requiresServer?: boolean;
  serverFieldLabel?: string;
}) {
  const hasPlayerId = Boolean(playerId.trim());
  const hasRequiredServer = !requiresServer || Boolean(serverId?.trim());
  const canCheck = hasPlayerId && hasRequiredServer;
  const href = canCheck
    ? buildTelegramCheckUserUrl({ gameName, gameCode, playerId, serverId, serverFieldLabel })
    : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-disabled={!canCheck}
      tabIndex={canCheck ? 0 : -1}
      onClick={(event) => {
        if (!canCheck) event.preventDefault();
      }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
        canCheck
          ? "border-sky-400/30 bg-sky-400/10 text-sky-300 hover:border-sky-300/50 hover:bg-sky-400/20"
          : "cursor-not-allowed border-white/10 bg-white/5 text-muted-foreground/60"
      }`}
      data-testid="link-telegram-check-user"
    >
      <Send className="h-3.5 w-3.5" />
      {canCheck ? "Check user on Telegram" : "Enter details to check on Telegram"}
    </a>
  );
}

interface TelegramContactLinkProps {
  floating?: boolean;
  moveAboveDock?: boolean;
}

export function TelegramContactLink({
  floating = false,
  moveAboveDock = false,
}: TelegramContactLinkProps) {
  if (floating) {
    return <FloatingTelegramSupporter moveAboveDock={moveAboveDock} />;
  }

  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact us on Telegram"
      title="Contact us on Telegram"
      className="group inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-primary shadow-sm shadow-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/20"
      data-testid="link-telegram-contact"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
          <path d="M21.5 3.5 2.9 10.7c-1.3.5-1.3 1.2.2 1.5l4.8 1.5 1.8 5.5c.2.6.1.8.7.8.3 0 .4-.1.6-.3l2.3-2.2 4.8 3.5c.9.5 1.5.3 1.7-.8l3.1-15.1c.3-1.4-.5-2-1.7-1.6Zm-11 10.2-.2 3.1-1.1-3.5 8.7-6.2-7.4 6.6Z" />
        </svg>
      </span>
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em]">
        Contact us on Telegram
      </span>
    </a>
  );
}

function FloatingTelegramSupporter({ moveAboveDock }: { moveAboveDock: boolean }) {
  const [alertMessage, setAlertMessage] = useState("");
  const [autoTalking, setAutoTalking] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const alertQueueRef = useRef<string[]>([]);
  const { data: supporterSettings } = useQuery<SupporterSettings>({
    queryKey: ["storefront-supporter-settings"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/site-settings/supporter"), { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load supporter settings (${response.status})`);
      return response.json() as Promise<SupporterSettings>;
    },
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  useEffect(() => {
    const showNextAlert = () => {
      const nextMessage = alertQueueRef.current.shift();
      if (!nextMessage) {
        setAlertMessage("");
        timeoutRef.current = null;
        return;
      }

      setAlertMessage(nextMessage);
      timeoutRef.current = window.setTimeout(() => {
        setAlertMessage("");
        timeoutRef.current = window.setTimeout(showNextAlert, 350);
      }, 5000);
    };

    const handleAlert = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (!message) return;

      alertQueueRef.current.push(message);
      if (timeoutRef.current === null) showNextAlert();
    };

    window.addEventListener(TELEGRAM_SUPPORTER_ALERT_EVENT, handleAlert);
    return () => {
      window.removeEventListener(TELEGRAM_SUPPORTER_ALERT_EVENT, handleAlert);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      alertQueueRef.current = [];
    };
  }, []);

  useEffect(() => {
    const settings = supporterSettings ?? DEFAULT_SUPPORTER_SETTINGS;
    const messages = getSupporterMessages(settings.supporterMessage);
    let active = true;
    let timer: number | null = null;

    const scheduleNextCycle = () => {
      timer = window.setTimeout(() => {
        if (!active) return;
        setAutoMessage(messages[Math.floor(Math.random() * messages.length)] ?? DEFAULT_SUPPORTER_SETTINGS.supporterMessage);
        setAutoTalking(true);
        timer = window.setTimeout(() => {
          if (!active) return;
          setAutoTalking(false);
          scheduleNextCycle();
        }, settings.supporterTalkDurationSeconds * 1000);
      }, settings.supporterPauseDurationSeconds * 1000);
    };

    setAutoTalking(false);
    setAutoMessage("");
    if (!settings.supporterEnabled || messages.length === 0) {
      return () => {
        active = false;
        if (timer !== null) window.clearTimeout(timer);
      };
    }

    timer = window.setTimeout(() => {
      if (!active) return;
      setAutoMessage(messages[Math.floor(Math.random() * messages.length)] ?? DEFAULT_SUPPORTER_SETTINGS.supporterMessage);
      setAutoTalking(true);
      timer = window.setTimeout(() => {
        if (!active) return;
        setAutoTalking(false);
        scheduleNextCycle();
      }, settings.supporterTalkDurationSeconds * 1000);
    }, settings.supporterInitialDelaySeconds * 1000);

    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [
    supporterSettings?.supporterEnabled,
    supporterSettings?.supporterMessage,
    supporterSettings?.supporterInitialDelaySeconds,
    supporterSettings?.supporterTalkDurationSeconds,
    supporterSettings?.supporterPauseDurationSeconds,
  ]);

  const displayedMessage = alertMessage || (autoTalking ? autoMessage : "");
  const isTalking = Boolean(displayedMessage);

  return (
    <div className={`telegram-supporter fixed right-3 z-[90] flex flex-col items-end gap-1 sm:right-5 ${
      moveAboveDock ? "bottom-36 sm:bottom-28" : "bottom-6 sm:bottom-6"
    }`}>
      {displayedMessage && (
        <div
          role="status"
          aria-live="polite"
          className="telegram-alert-bubble khmer-font max-w-[220px] rounded-xl px-3 py-2 text-right text-[10px] font-medium leading-5 text-white/90"
        >
          <span>{displayedMessage}</span>
        </div>
      )}
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact us on Telegram"
        title="Contact us on Telegram"
        className={`telegram-floating-tab group flex h-16 w-14 flex-col items-center justify-center gap-0.5 p-0 text-white transition-all hover:-translate-y-1 sm:h-[4.75rem] sm:w-16 ${isTalking ? "is-talking" : ""}`}
      >
        <span className="telegram-icon-box flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 p-0 shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all group-hover:border-white/15 group-hover:shadow-[0_9px_22px_rgba(14,165,233,0.24)] sm:h-14 sm:w-14" aria-hidden="true">
          <span className={`telegram-mascot h-10 w-10 rounded-full sm:h-12 sm:w-12 ${isTalking ? "is-talking" : ""}`} />
        </span>
        <span className="khmer-font text-[9px] leading-none text-white/75 sm:text-[10px]">
          ជំនួយការ
        </span>
      </a>
    </div>
  );
}