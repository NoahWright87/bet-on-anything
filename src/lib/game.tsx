"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  NOT_THAT_ID,
  computeResult,
  toggleWinner as toggleWinnerSet,
  type Bet,
  type TableSettings,
  type Wager,
} from "./bets";
import { usePlayer } from "./player";

/**
 * Local, in-memory game state: chips and bets per table. It resets on reload.
 * This is the seam the Worker backend replaces (see DATA.todo.md): keep the shape of
 * `useTable` and the pages won't need to change. The betting rules live in `./bets`.
 *
 * Actions return an error message to show the player, or null on success.
 */

export const STARTING_CHIPS = 1000;
export const MAX_TITLE_LENGTH = 60;
export const MAX_LABEL_LENGTH = 24;

/** Shows a "pretend a friend confirmed" button so one person can try the whole flow. Remove with the backend. */
export const DEMO_MODE = true;

type TableState = {
  others: string[]; // the other players at the table (you are always there)
  bets: Bet[];
  settings: TableSettings;
  closed: boolean;
};

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

/** Placeholder bets from other players so a new table isn't empty. Remove once bets are real. */
function sampleBets(settings: TableSettings): Bet[] {
  const w = (id: string, player: string, amount: number): Wager => ({ id, player, amount });
  const mvp: Bet = {
    id: "sample-mvp",
    title: "Who gets MVP",
    creator: "Alex Rivera",
    options: [
      { id: "mvp-charles", label: "Charles", wagers: [w("s3a", "Alex Rivera", 30)] },
      { id: "mvp-dana", label: "Dana", wagers: [w("s3b", "Sam Patel", 30)] },
    ],
    notThat: [],
    updatedAt: 1,
  };
  mvp.result = computeResult(mvp, settings, ["mvp-charles"]);
  return [
    {
      id: "sample-winner",
      title: "Challenge winner",
      creator: "Alex Rivera",
      options: [
        { id: "win-andy", label: "Andy", wagers: [w("s1a", "Alex Rivera", 50), w("s1b", "Sam Patel", 25)] },
        { id: "win-betty", label: "Betty", wagers: [w("s1c", "Jordan Lee", 100)] },
      ],
      notThat: [],
      updatedAt: 3,
    },
    {
      id: "sample-raw",
      title: "Chef yells \"IT'S RAW!\"",
      creator: "Sam Patel",
      options: [{ id: "raw-yes", label: "Yes", wagers: [w("s2a", "Sam Patel", 40)] }],
      notThat: [],
      proposal: { winners: ["raw-yes"], proposedBy: "Sam Patel", confirmedBy: ["Sam Patel"] },
      updatedAt: 2,
    },
    mvp,
  ];
}

// Shared, never mutated: a table nobody has touched yet renders these same seed bets.
const SAMPLE_PLAYERS = ["Alex Rivera", "Sam Patel", "Jordan Lee"];
const INITIAL: TableState = {
  others: SAMPLE_PLAYERS,
  bets: sampleBets(DEFAULT_SETTINGS),
  settings: DEFAULT_SETTINGS,
  closed: false,
};

type GameContextValue = {
  tables: Record<string, TableState>;
  update: (code: string, fn: (t: TableState) => TableState) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Record<string, TableState>>({});

  const update = useCallback((code: string, fn: (t: TableState) => TableState) => {
    setTables((all) => ({ ...all, [code]: fn(all[code] ?? INITIAL) }));
  }, []);

  const value = useMemo(() => ({ tables, update }), [tables, update]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

let lastTick = 0;
/** Monotonic activity clock so bets with the latest activity sort first. */
const tick = () => (lastTick = Math.max(Date.now(), lastTick + 1));

const stakeError = (amount: number, chips: number): string | null =>
  Number.isInteger(amount) && amount >= 1 && amount <= chips ? null : `Pick 1 to ${chips} chips`;

const cleanLabel = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, MAX_LABEL_LENGTH);

const hasLabel = (bet: Bet, label: string) =>
  bet.options.some((o) => o.label.toLowerCase() === label.toLowerCase());

/** Settles the bet once enough different players agree. Payouts show up in everyone's derived chips. */
function settleIfReady(settings: TableSettings, bet: Bet): Bet {
  const p = bet.proposal;
  if (!p || p.confirmedBy.length < settings.confirmationsRequired) return bet;
  return { ...bet, proposal: undefined, result: computeResult(bet, settings, p.winners) };
}

const replaceBet = (t: TableState, betId: string, fn: (b: Bet) => Bet): TableState => ({
  ...t,
  bets: t.bets.map((b) => (b.id === betId ? fn(b) : b)),
});

const canAfford = (t: TableState, amount: number, player: string) =>
  !stakeError(amount, chipsOf(player, t.bets));

export type PlayerSummary = { name: string; chips: number; isYou: boolean };

export function useTable(code: string) {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useTable must be used inside <GameProvider>");
  const { name: you } = usePlayer();
  const { tables, update } = ctx;
  const table = tables[code] ?? INITIAL;
  const chips = chipsOf(you, table.bets);

  // Actions validate against the current snapshot (state updaters run later, so they can't
  // report back), then re-check inside the updater so a stale double-submit can't overspend.

  const createBet = useCallback(
    (title: string, guess: string, amount: number): string | null => {
      const text = title.trim().slice(0, MAX_TITLE_LENGTH);
      const label = cleanLabel(guess);
      if (table.closed) return "This table is closed";
      if (!text) return "Name the bet";
      if (!label) return "Add your guess";
      const err = stakeError(amount, chips);
      if (err) return err;
      const bet: Bet = {
        id: nextId("bet"),
        title: text,
        creator: you,
        options: [{ id: nextId("opt"), label, wagers: [{ id: nextId("w"), player: you, amount }] }],
        notThat: [],
        updatedAt: tick(),
      };
      update(code, (t) => (canAfford(t, amount, you) ? { ...t, bets: [bet, ...t.bets] } : t));
      return null;
    },
    [code, chips, table.closed, update, you],
  );

  const addOption = useCallback(
    (betId: string, guess: string, amount: number): string | null => {
      const bet = table.bets.find((b) => b.id === betId);
      const label = cleanLabel(guess);
      if (!bet || bet.result || table.closed) return "This bet is closed";
      if (!label) return "Add your guess";
      if (hasLabel(bet, label) || label.toLowerCase() === "not that") return `"${label}" is already an option`;
      const err = stakeError(amount, chips);
      if (err) return err;
      const option = { id: nextId("opt"), label, wagers: [{ id: nextId("w"), player: you, amount }] };
      const at = tick();
      update(code, (t) =>
        canAfford(t, amount, you)
          ? replaceBet(t, betId, (b) => ({
              ...b,
              options: [...b.options, option],
              proposal: undefined, // a new option invalidates any proposed result
              updatedAt: at,
            }))
          : t,
      );
      return null;
    },
    [code, table.bets, chips, table.closed, update, you],
  );

  const wager = useCallback(
    (betId: string, optionId: string, amount: number): string | null => {
      const bet = table.bets.find((b) => b.id === betId);
      if (!bet || bet.result || table.closed) return "This bet is closed";
      const err = stakeError(amount, chips);
      if (err) return err;
      const entry: Wager = { id: nextId("w"), player: you, amount };
      const at = tick();
      update(code, (t) =>
        canAfford(t, amount, you)
          ? replaceBet(t, betId, (b) => ({
              ...b,
              options:
                optionId === NOT_THAT_ID
                  ? b.options
                  : b.options.map((o) => (o.id === optionId ? { ...o, wagers: [...o.wagers, entry] } : o)),
              notThat: optionId === NOT_THAT_ID ? [...b.notThat, entry] : b.notThat,
              updatedAt: at,
            }))
          : t,
      );
      return null;
    },
    [code, table.bets, chips, table.closed, update, you],
  );

  /** Adds/removes an option from the proposed winners; changing the proposal restarts confirmations. */
  const proposeWinner = useCallback(
    (betId: string, optionId: string): void => {
      const at = tick();
      update(code, (t) => {
        const bet = t.bets.find((b) => b.id === betId);
        if (!bet || bet.result) return t;
        const winners = toggleWinnerSet(bet.proposal?.winners ?? [], optionId);
        const proposed: Bet = {
          ...bet,
          proposal: winners.length ? { winners, proposedBy: you, confirmedBy: [you] } : undefined,
          updatedAt: at,
        };
        return replaceBet(t, betId, () => settleIfReady(t.settings, proposed));
      });
    },
    [code, update, you],
  );

  const confirmWith = useCallback(
    (betId: string, who: string): void => {
      const at = tick();
      update(code, (t) => {
        const bet = t.bets.find((b) => b.id === betId);
        if (!bet?.proposal || bet.proposal.confirmedBy.includes(who)) return t;
        const confirmed: Bet = {
          ...bet,
          proposal: { ...bet.proposal, confirmedBy: [...bet.proposal.confirmedBy, who] },
          updatedAt: at,
        };
        return replaceBet(t, betId, () => settleIfReady(t.settings, confirmed));
      });
    },
    [code, update],
  );

  const confirmResolution = useCallback((betId: string) => confirmWith(betId, you), [confirmWith, you]);

  /** Demo only: stands in for a different player confirming. */
  const simulateFriendConfirm = useCallback(
    (betId: string) => {
      const bet = table.bets.find((b) => b.id === betId);
      const friend = table.others.find((f) => !bet?.proposal?.confirmedBy.includes(f));
      if (friend) confirmWith(betId, friend);
    },
    [confirmWith, table.bets, table.others],
  );

  const cancelProposal = useCallback(
    (betId: string): void => {
      update(code, (t) => replaceBet(t, betId, (b) => ({ ...b, proposal: undefined, updatedAt: tick() })));
    },
    [code, update],
  );

  /** Changing the house bid or confirmations applies to open bets; settled bets keep their result. */
  const updateSettings = useCallback(
    (settings: TableSettings): void => {
      update(code, (t) => ({ ...t, settings }));
    },
    [code, update],
  );

  const closeTable = useCallback((): void => {
    update(code, (t) => ({ ...t, closed: true }));
  }, [code, update]);

  const bets = useMemo(() => [...table.bets].sort((a, b) => b.updatedAt - a.updatedAt), [table.bets]);

  // You first, then everyone else by chips (richest first).
  const players: PlayerSummary[] = useMemo(
    () => [
      { name: you, chips: chipsOf(you, table.bets), isYou: true },
      ...table.others
        .map((name) => ({ name, chips: chipsOf(name, table.bets), isYou: false }))
        .sort((a, b) => b.chips - a.chips),
    ],
    [you, table.bets, table.others],
  );

  return {
    you,
    isHost: true, // placeholder: whoever opens the table is the host until accounts exist
    chips,
    players,
    bets,
    settings: table.settings,
    closed: table.closed,
    createBet,
    addOption,
    wager,
    proposeWinner,
    confirmResolution,
    simulateFriendConfirm,
    cancelProposal,
    updateSettings,
    closeTable,
  };
}
