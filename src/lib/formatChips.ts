const SUFFIXES = ["", "K", "M", "B", "T"];

/** Below this, show the whole number with thousands separators. */
const ABBREVIATE_FROM = 10_000;

/** Quadrillion and above switches to scientific notation. */
const SCIENTIFIC_FROM = 1e15;

/**
 * Compact chip count that always shows four significant digits once abbreviated,
 * so the width barely changes as the number grows.
 *
 *   999        -> "999"
 *   9,999      -> "9,999"
 *   12,345     -> "12.35 K"
 *   999,999    -> "1.000 M"
 *   2.5e9      -> "2.500 B"
 *   1e15       -> "1.000e15"
 */
export function formatChips(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(amount));

  if (abs < ABBREVIATE_FROM) return sign + abs.toLocaleString("en-US");
  if (abs >= SCIENTIFIC_FROM) return sign + scientific(abs);

  let tier = Math.floor(Math.log10(abs) / 3);
  // log10 can round up to an exact power of 1000 just below it.
  if (tier >= SUFFIXES.length) return sign + scientific(abs);
  let text = (abs / 10 ** (3 * tier)).toPrecision(4);
  // Rounding can carry into the next tier (999,999 -> "1000" K -> 1.000 M).
  if (Number(text) >= 1000) {
    tier += 1;
    if (tier >= SUFFIXES.length) return sign + scientific(abs);
    text = (abs / 10 ** (3 * tier)).toPrecision(4);
  }
  return `${sign}${text} ${SUFFIXES[tier]}`;
}

function scientific(abs: number): string {
  return abs.toExponential(3).replace("e+", "e");
}
