import { Game } from "@/lib/api-client-react";

export const CATEGORIES = [
  "All",
  "MOBA",
  "Battle Royale",
  "RPG",
  "Shooter",
  "Strategy",
  "Sports",
  "Casual",
];

export function generateGamePlaceholder(gameCode: string): string {
  // A simple deterministic color based on game code
  const colors = [
    "from-slate-600 to-slate-950",
    "from-cyan-800 to-slate-950",
    "from-blue-700 to-indigo-950",
    "from-emerald-700 to-slate-950",
    "from-sky-700 to-blue-950",
    "from-violet-700 to-slate-950",
  ];
  let hash = 0;
  for (let i = 0; i < gameCode.length; i++) {
    hash = gameCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatCurrency(amount: string | number, currency: "USD" | "KHR" = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function normalizeTelegramUsername(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function parseMobileLegendsPlayerInput(value: string): { playerId: string; serverId: string } | null {
  const match = value.trim().match(/^(\d+)\s*\(\s*(\d+)\s*\)$/);
  return match ? { playerId: match[1], serverId: match[2] } : null;
}

const ID_CHECKER_GAMES = [
  "zepeto",
  "growtopia",
  "pixelgun3d",
  "magicchessgogo",
  "mcgg",
  "mobilelegendsadventure",
  "8ballpool",
  "pubgmobile",
  "pubgm",
  "identityv",
  "supersus",
  "honorofkings",
];

export function supportsPlayerIdCheck(gameCode = "", gameName = ""): boolean {
  const searchable = `${gameCode} ${gameName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ID_CHECKER_GAMES.some((game) => searchable.includes(game));
}
