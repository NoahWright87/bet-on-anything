/**
 * Bet model and payout math. Plain TypeScript (no React, no platform APIs): the Worker is the
 * authority, and the app imports the same file to render and to pre-validate.
 *
 * A bet is a question ("Challenge winner") with several possible outcomes ("options"),
 * e.g. Andy, Betty. Players wager chips on an option. Every bet also has a built-in
 * "Not that" outcome (anything not listed) that the house backs automatically.
 *
 * Placeholder rules, all tunable per table via `TableSettings`:
 * - Every time a player bets on a listed option, the house adds a bet on "Not that" of
 *   `houseBidPercent` of that bet, but at least `houseBidMin` chips. So a lone winner still
 *   earns something, and the house pool grows with every bet (early and often pays). House
 *   chips are minted, so the economy inflates on purpose. Setting both to 0 turns it off;
 *   "Not that" stays, it just gets no automatic bets.
 * - Payout is pooled: everything staked (house included) is split among the backers of the
 *   winning option(s) in proportion to their stakes. Several winners (a tie) pool together.
 * - The house's share of a win disappears.
 * - A resolution needs `confirmationsRequired` different players to agree.
 */

import { STARTING_CHIPS } from "./limits";

export const NOT_THAT_ID = "not-that";
export const NOT_THAT_LABEL = "Not that";
export const HOUSE = "House";

export type Wager = { id: string; player: string; amount: number };

export type BetOption = { id: string; label: string; wagers: Wager[] };

export type Proposal = {
  winners: string[]; // option ids (NOT_THAT_ID alone means "none of the listed options")
  proposedBy: string;
  confirmedBy: string[]; // includes the proposer
};

export type Result = {
  winners: string[];
  pot: number;
  payouts: Record<string, number>; // player -> chips paid out
  burned: number; // pot not paid to players (the house's share)
};

export type Bet = {
  id: string;
  title: string;
  creator: string;
  options: BetOption[];
  notThat: Wager[]; // explicit wagers on "Not that" (the house bid is derived)
  proposal?: Proposal;
  result?: Result;
  updatedAt: number; // activity clock: bets with the latest activity sort first
};

export type TableSettings = {
  houseBidPercent: number; // % of each bet on a listed option that the house adds to "Not that"
  houseBidMin: number; // ...but never fewer than this many chips (0 and 0 disables the house bid)
  confirmationsRequired: number; // distinct players needed to settle a bet
};

export const DEFAULT_SETTINGS: TableSettings = { houseBidPercent: 1, houseBidMin: 1, confirmationsRequired: 2 };

/** The house's automatic "Not that" bet in response to one bet of `amount` on a listed option. */
export function houseBidFor(amount: number, settings: TableSettings): number {
  const pct = Number.isFinite(settings.houseBidPercent) ? Math.max(0, settings.houseBidPercent) : 0;
  const min = Number.isFinite(settings.houseBidMin) ? Math.max(0, Math.round(settings.houseBidMin)) : 0;
  return Math.max(Math.round((amount * pct) / 100), min);
}

/** Total chips the house has put on "Not that": one automatic bet per bet on a listed option. */
export function houseStake(bet: Bet, settings: TableSettings): number {
  return bet.options
    .flatMap((o) => o.wagers)
    .reduce((sum, w) => sum + houseBidFor(w.amount, settings), 0);
}

/** All outcomes of a bet, "Not that" last, with the house's automatic wager included. */
export function allOptions(bet: Bet, settings: TableSettings): (BetOption & { isNotThat: boolean })[] {
  const house: Wager = {
    id: `${bet.id}-house`,
    player: HOUSE,
    amount: houseStake(bet, settings),
  };
  return [
    ...bet.options.map((o) => ({ ...o, isNotThat: false })),
    {
      id: NOT_THAT_ID,
      label: NOT_THAT_LABEL,
      wagers: house.amount > 0 ? [house, ...bet.notThat] : [...bet.notThat],
      isNotThat: true,
    },
  ];
}

export const optionTotal = (o: { wagers: Wager[] }): number => o.wagers.reduce((s, w) => s + w.amount, 0);

export const betPot = (bet: Bet, settings: TableSettings): number =>
  allOptions(bet, settings).reduce((s, o) => s + optionTotal(o), 0);

/**
 * Pooled payout for a set of winning options. See the rules at the top of this file.
 * Shares are rounded with the largest-remainder method so every chip in the pot is handed
 * out (a house bonus split between backers is never rounded away); the house's own share
 * is the only part that disappears.
 */
export function computeResult(bet: Bet, settings: TableSettings, winners: string[]): Result {
  const options = allOptions(bet, settings);
  const pot = options.reduce((s, o) => s + optionTotal(o), 0);
  const winningWagers = options.filter((o) => winners.includes(o.id)).flatMap((o) => o.wagers);
  const winningTotal = winningWagers.reduce((s, w) => s + w.amount, 0);

  if (winningTotal === 0) return { winners, pot, payouts: {}, burned: pot };

  const shares = winningWagers.map((w, i) => {
    const exact = (w.amount * pot) / winningTotal;
    return { player: w.player, i, whole: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let leftover = pot - shares.reduce((s, x) => s + x.whole, 0);
  for (const x of [...shares].sort((a, b) => b.fraction - a.fraction || a.i - b.i)) {
    if (leftover <= 0) break;
    x.whole += 1;
    leftover -= 1;
  }

  const payouts: Record<string, number> = {};
  let burned = 0;
  for (const x of shares) {
    if (x.player === HOUSE) burned += x.whole;
    else payouts[x.player] = (payouts[x.player] ?? 0) + x.whole;
  }
  return { winners, pot, payouts, burned };
}

/** Toggle an option in a proposed winner set. "Not that" excludes every listed option and vice versa. */
export function toggleWinner(winners: string[], optionId: string): string[] {
  if (optionId === NOT_THAT_ID) return winners.includes(NOT_THAT_ID) ? [] : [NOT_THAT_ID];
  const without = winners.filter((id) => id !== NOT_THAT_ID);
  return without.includes(optionId) ? without.filter((id) => id !== optionId) : [...without, optionId];
}

/** Tiny label for a chip token: 999, 1.5K, 12K, 123K, 1.2M ... */
export function formatChipsCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  const abs = Math.abs(Math.trunc(amount));
  if (abs < 1000) return String(Math.sign(amount) * abs);
  const suffixes = ["K", "M", "B", "T"];
  let tier = Math.min(Math.floor(Math.log10(abs) / 3), suffixes.length);
  let scaled = abs / 10 ** (3 * tier);
  let text = scaled < 10 ? scaled.toFixed(1).replace(/\.0$/, "") : String(Math.round(scaled));
  if (Number(text) >= 1000 && tier < suffixes.length) {
    tier += 1;
    scaled = abs / 10 ** (3 * tier);
    text = scaled < 10 ? scaled.toFixed(1).replace(/\.0$/, "") : String(Math.round(scaled));
  }
  if (abs >= 1e15) return `${Math.sign(amount) < 0 ? "-" : ""}${abs.toExponential(0).replace("e+", "e")}`;
  return `${Math.sign(amount) < 0 ? "-" : ""}${text}${suffixes[tier - 1]}`;
}

/**
 * A player's chips are derived, never stored: they start with STARTING_CHIPS, lose what they
 * stake, and gain what they are paid. (The house is not a player.)
 */
export function chipsOf(player: string, bets: Bet[]): number {
  let chips = STARTING_CHIPS;
  for (const bet of bets) {
    const wagers = [...bet.options.flatMap((o) => o.wagers), ...bet.notThat];
    for (const w of wagers) if (w.player === player) chips -= w.amount;
    chips += bet.result?.payouts[player] ?? 0;
  }
  return chips;
}
