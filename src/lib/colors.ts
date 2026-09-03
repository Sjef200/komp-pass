import type { Karakter } from "./types";

export const KARAKTER_FARGER: Record<Karakter | 0, string> = {
  6: "#2E6B4B",
  5: "#4C8C63",
  4: "#B0770F",
  3: "#C2622C",
  2: "#A63A2A",
  1: "#7F241B",
  0: "#9B9B93",
};

export function karakterFarge(k: number | null | undefined): string {
  if (k == null || k < 1 || k > 6) return KARAKTER_FARGER[0];
  return KARAKTER_FARGER[k as Karakter];
}

/** Statusemoji for et tema ut fra siste karakter. Ett per rad. */
export function statusEmoji(k: number | null | undefined): string {
  if (k == null) return "⚪";
  if (k >= 5) return "🟢";
  if (k === 4) return "🟡";
  return "🔴";
}

export function statusTekst(k: number | null | undefined): string {
  if (k == null) return "ikke hørt ennå";
  if (k >= 5) return "sitter";
  if (k === 4) return "nesten";
  return "svakt";
}
