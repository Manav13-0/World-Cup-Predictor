import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function makeLeagueCode(length = 7) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function stableTeamId(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const positive = Math.abs(hash) % 1000000000;
  return positive === 0 ? 1 : -positive;
}

export function shortTeamName(name: string | null | undefined, length = 16) {
  const value = typeof name === "string" && name.trim() ? name.trim() : "Team";
  return value.slice(0, length);
}

export function formatPredictionLabel(
  prediction: "HOME_WIN" | "AWAY_WIN" | "DRAW",
  homeTeamName: string,
  awayTeamName: string
) {
  if (prediction === "DRAW") return "Draw";
  return prediction === "HOME_WIN" ? `${homeTeamName} win` : `${awayTeamName} win`;
}
