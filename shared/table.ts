/**
 * Table state and the one function that changes it. Pure TypeScript, no platform APIs.
 *
 * The Worker's Durable Object is the authority: it runs every player action through
 * `applyAction`, persists the returned `Change`, and broadcasts it. The app runs the same
 * function against its local copy as a dry run, so forms can show an error instantly instead
 * of waiting for a round trip. Never trust the dry run: the Worker re-validates everything.
 *
 * Actions arrive over the network, so they are coerced defensively (`str`, `num`).
 */

import {
  MAX_AMOUNT,
  MAX_BETS,
  MAX_LABEL_LENGTH,
  MAX_OPTIONS,
  MAX_PLAYERS,
  MAX_TITLE_LENGTH,
  MAX_WAGERS_PER_BET,
} from "./limits";
import {
  NOT_THAT_ID,
  NOT_THAT_LABEL,
  chipsOf,
  computeResult,
  toggleWinner,
  type Bet,
  type TableSettings,
  type Wager,
} from "./bets";

export type TableState = {
  host: string; // player name of the host ("" until the first player joins)
  players: string[]; // names in join order; the name is the player's identity at this table
  bets: Bet[];
  settings: TableSettings;
  closed: boolean;
};

export type Action =
  | { type: "createBet"; title: string; guess: string; amount: number }
  | { type: "addOption"; betId: string; guess: string; amount: number }
  | { type: "wager"; betId: string; optionId: string; amount: number }
  | { type: "proposeWinner"; betId: string; optionId: string }
  | { type: "confirm"; betId: string }
  | { type: "cancelProposal"; betId: string }
  | { type: "updateSettings"; settings: TableSettings }
  | { type: "closeTable" };

/**
 * What one action (or a join) changed: the unit that is stored and broadcast, so a message
 * carries one bet, never the whole table.
 */
export type Change = {
  bet?: Bet; // a new or updated bet (replace by id)
  settings?: TableSettings;
  closed?: boolean;
  joined?: string; // a new player's name
  host?: string; // set together with `joined` when the first player becomes host
};

export type Outcome = { ok: true; change: Change } | { ok: false; error: string };

/** Things the reducer needs from its environment, so it stays deterministic and testable. */
export type Env = {
  newId: (prefix: string) => string;
  /** Monotonic activity clock: bets with the latest activity sort first. */
  now: () => number;
};

export function applyChange(state: TableState, change: Change): TableState {
  let next = state;
  if (change.joined && !next.players.includes(change.joined)) {
    next = { ...next, players: [...next.players, change.joined], host: change.host ?? next.host };
  }
  if (change.settings) next = { ...next, settings: change.settings };
  if (change.closed !== undefined) next = { ...next, closed: change.closed };
  const bet = change.bet;
  if (bet) {
    const exists = next.bets.some((b) => b.id === bet.id);
    next = { ...next, bets: exists ? next.bets.map((b) => (b.id === bet.id ? bet : b)) : [...next.bets, bet] };
  }
  return next;
}

const fail = (error: string): Outcome => ({ ok: false, error });
const done = (change: Change): Outcome => ({ ok: true, change });

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" ? v : NaN);

export const cleanLabel = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, MAX_LABEL_LENGTH);

export const stakeError = (amount: number, chips: number): string | null =>
  Number.isInteger(amount) && amount >= 1 && amount <= chips ? null : `Pick 1 to ${chips} chips`;

const hasLabel = (bet: Bet, label: string) =>
  bet.options.some((o) => o.label.toLowerCase() === label.toLowerCase());

export function settingsError(s: TableSettings): string | null {
  const percent = num(s?.houseBidPercent);
  const min = num(s?.houseBidMin);
  const confirmations = num(s?.confirmationsRequired);
  if (!(percent >= 0 && percent <= 100)) return "House bid must be 0 to 100%";
  if (!(Number.isInteger(min) && min >= 0 && min <= MAX_AMOUNT)) return `House bid minimum must be 0 to ${MAX_AMOUNT} chips`;
  if (!(Number.isInteger(confirmations) && confirmations >= 1 && confirmations <= MAX_PLAYERS)) {
    return `Settling needs 1 to ${MAX_PLAYERS} people`;
  }
  return null;
}

/** Settles the bet once enough different players agree. Payouts show up in everyone's derived chips. */
function settleIfReady(settings: TableSettings, bet: Bet): Bet {
  const p = bet.proposal;
  if (!p || p.confirmedBy.length < settings.confirmationsRequired) return bet;
  return { ...bet, proposal: undefined, result: computeResult(bet, settings, p.winners) };
}

export function applyAction(state: TableState, actor: string, action: Action, env: Env): Outcome {
  if (!state.players.includes(actor)) return fail("Join the table first");
  const chips = chipsOf(actor, state.bets);
  const findBet = (id: unknown) => state.bets.find((b) => b.id === id);

  switch (action?.type) {
    case "createBet": {
      const title = str(action.title).trim().slice(0, MAX_TITLE_LENGTH);
      const label = cleanLabel(str(action.guess));
      const amount = num(action.amount);
      if (state.closed) return fail("This table is closed");
      if (!title) return fail("Name the bet");
      if (!label) return fail("Add your guess");
      if (label.toLowerCase() === NOT_THAT_LABEL.toLowerCase()) return fail(`"${label}" is already an option`);
      if (state.bets.length >= MAX_BETS) return fail("This table has too many bets");
      const err = stakeError(amount, chips);
      if (err) return fail(err);
      const bet: Bet = {
        id: env.newId("bet"),
        title,
        creator: actor,
        options: [{ id: env.newId("opt"), label, wagers: [{ id: env.newId("w"), player: actor, amount }] }],
        notThat: [],
        updatedAt: env.now(),
      };
      return done({ bet });
    }

    case "addOption": {
      const bet = findBet(action.betId);
      const label = cleanLabel(str(action.guess));
      const amount = num(action.amount);
      if (!bet || bet.result || state.closed) return fail("This bet is closed");
      if (!label) return fail("Add your guess");
      if (hasLabel(bet, label) || label.toLowerCase() === NOT_THAT_LABEL.toLowerCase()) {
        return fail(`"${label}" is already an option`);
      }
      if (bet.options.length >= MAX_OPTIONS) return fail("This bet has too many guesses");
      const err = stakeError(amount, chips);
      if (err) return fail(err);
      const option = { id: env.newId("opt"), label, wagers: [{ id: env.newId("w"), player: actor, amount }] };
      return done({
        bet: {
          ...bet,
          options: [...bet.options, option],
          proposal: undefined, // a new option invalidates any proposed result
          updatedAt: env.now(),
        },
      });
    }

    case "wager": {
      const bet = findBet(action.betId);
      const optionId = str(action.optionId);
      const amount = num(action.amount);
      if (!bet || bet.result || state.closed) return fail("This bet is closed");
      if (optionId !== NOT_THAT_ID && !bet.options.some((o) => o.id === optionId)) return fail("No such guess");
      const wagerCount = bet.options.reduce((n, o) => n + o.wagers.length, bet.notThat.length);
      if (wagerCount >= MAX_WAGERS_PER_BET) return fail("This bet has too many wagers");
      const err = stakeError(amount, chips);
      if (err) return fail(err);
      const entry: Wager = { id: env.newId("w"), player: actor, amount };
      return done({
        bet: {
          ...bet,
          options:
            optionId === NOT_THAT_ID
              ? bet.options
              : bet.options.map((o) => (o.id === optionId ? { ...o, wagers: [...o.wagers, entry] } : o)),
          notThat: optionId === NOT_THAT_ID ? [...bet.notThat, entry] : bet.notThat,
          updatedAt: env.now(),
        },
      });
    }

    /** Adds/removes an option from the proposed winners; changing the proposal restarts confirmations. */
    case "proposeWinner": {
      const bet = findBet(action.betId);
      const optionId = str(action.optionId);
      if (!bet) return fail("No such bet");
      if (bet.result) return fail("This bet is already settled");
      if (optionId !== NOT_THAT_ID && !bet.options.some((o) => o.id === optionId)) return fail("No such guess");
      const winners = toggleWinner(bet.proposal?.winners ?? [], optionId);
      const proposed: Bet = {
        ...bet,
        proposal: winners.length ? { winners, proposedBy: actor, confirmedBy: [actor] } : undefined,
        updatedAt: env.now(),
      };
      return done({ bet: settleIfReady(state.settings, proposed) });
    }

    case "confirm": {
      const bet = findBet(action.betId);
      if (!bet) return fail("No such bet");
      if (!bet.proposal) return fail("Nothing to confirm");
      if (bet.proposal.confirmedBy.includes(actor)) return fail("You already confirmed this");
      const confirmed: Bet = {
        ...bet,
        proposal: { ...bet.proposal, confirmedBy: [...bet.proposal.confirmedBy, actor] },
        updatedAt: env.now(),
      };
      return done({ bet: settleIfReady(state.settings, confirmed) });
    }

    case "cancelProposal": {
      const bet = findBet(action.betId);
      if (!bet) return fail("No such bet");
      if (!bet.proposal) return fail("Nothing to cancel");
      return done({ bet: { ...bet, proposal: undefined, updatedAt: env.now() } });
    }

    /** Changing the house bid or confirmations applies to open bets; settled bets keep their result. */
    case "updateSettings": {
      if (actor !== state.host) return fail("Only the host can change table settings");
      const raw = action.settings;
      const settings: TableSettings = {
        houseBidPercent: num(raw?.houseBidPercent),
        houseBidMin: num(raw?.houseBidMin),
        confirmationsRequired: num(raw?.confirmationsRequired),
      };
      const err = settingsError(settings);
      if (err) return fail(err);
      return done({ settings });
    }

    case "closeTable": {
      if (actor !== state.host) return fail("Only the host can close the table");
      return done({ closed: true });
    }

    default:
      return fail("Unknown action");
  }
}
