import { HOUSE } from "../../shared/bets";

/** Chip colors: you are always blue, the house is gray, everyone else gets a stable color from their name. */
export const YOU_COLOR = "#2563eb";
export const HOUSE_COLOR = "#6b7280";
const PALETTE = ["#ea580c", "#0d9488", "#db2777", "#ca8a04", "#4f46e5", "#65a30d", "#0891b2"];

export function playerColor(player: string, you: string): string {
  if (player === you) return YOU_COLOR;
  if (player === HOUSE) return HOUSE_COLOR;
  let hash = 0;
  for (const ch of player) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
