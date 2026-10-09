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
const DEMO_FRIENDS = ["Alex Rivera", "Sam Patel", "Jordan Lee"];

type TableState = { chips: number; bets: Bet[]; settings: TableSettings; closed: boolean };

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
const INITIAL: TableState = {
  chips: STARTING_CHIPS,
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

/** Settles the bet once enough different players agree; pays out your share into `chips`. */
function settleIfReady(t: TableState, bet: Bet, you: string): { bet: Bet; chips: number } {
  const p = bet.proposal;
  if (!p || p.confirmedBy.length < t.settings.confirmationsRequired) return { bet, chips: t.chips };
  const result = computeResult(bet, t.settings, p.winners);
  return { bet: { ...bet, proposal: undefined, result }, chips: t.chips + (result.payouts[you] ?? 0) };
}

export function useTable(code: string) {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useTable must be used inside <GameProvider>");
  const { name: you } = usePlayer();
  const { tables, update } = ctx;
  const table = tables[code] ?? INITIAL;

  // Actions validate against the current snapshot (state updaters run later, so they can't
  // report back), then re-check inside the updater so a stale double-submit can't overspend.
  const replaceBet = (t: TableState, betId: string, fn: (b: Bet) => Bet): TableState => ({
    ...t,
    bets: t.bets.map((b) => (b.id === betId ? fn(b) : b)),
  });

  const createBet = useCallback(
    (title: string, guess: string, amount: number): string | null => {
      const text = title.trim().slice(0, MAX_TITLE_LENGTH);
      const label = cleanLabel(guess);
      if (table.closed) return "This table is closed";
      if (!text) return "Name the bet";
      if (!label) return "Add your guess";
      const err = stakeError(amount, table.chips);
      if (err) return err;
      const bet: Bet = {
        id: nextId("bet"),
        title: text,
        creator: you,
        options: [{ id: nextId("opt"), label, wagers: [{ id: nextId("w"), player: you, amount }] }],
        notThat: [],
        updatedAt: tick(),
      };
      update(code, (t) => (stakeError(amount, t.chips) ? t : { ...t, chips: t.chips - amount, bets: [bet, ...t.bets] }));
      return null;
    },
    [code, table.chips, table.closed, update, you],
  );

  const addOption = useCallback(
    (betId: string, guess: string, amount: number): string | null => {
      const bet = table.bets.find((b) => b.id === betId);
      const label = cleanLabel(guess);
      if (!bet || bet.result || table.closed) return "This bet is closed";
      if (!label) return "Add your guess";
      if (hasLabel(bet, label) || label.toLowerCase() === "not that") return `"${label}" is already an option`;
      const err = stakeError(amount, table.chips);
      if (err) return err;
      const option = { id: nextId("opt"), label, wagers: [{ id: nextId("w"), player: you, amount }] };
      const at = tick();
      update(code, (t) =>
        stakeError(amount, t.chips)
          ? t
          : {
              ...replaceBet(t, betId, (b) => ({
                ...b,
                options: [...b.options, option],
                proposal: undefined, // a new option invalidates any proposed result
                updatedAt: at,
              })),
              chips: t.chips - amount,
            },
      );
      return null;
    },
    [code, table.bets, table.chips, table.closed, update, you],
  );

  const wager = useCallback(
    (betId: string, optionId: string, amount: number): string | null => {
      const bet = table.bets.find((b) => b.id === betId);
      if (!bet || bet.result || table.closed) return "This bet is closed";
      const err = stakeError(amount, table.chips);
      if (err) return err;
      const entry: Wager = { id: nextId("w"), player: you, amount };
      const at = tick();
      update(code, (t) =>
        stakeError(amount, t.chips)
          ? t
          : {
              ...replaceBet(t, betId, (b) => ({
                ...b,
                options:
                  optionId === NOT_THAT_ID
                    ? b.options
                    : b.options.map((o) => (o.id === optionId ? { ...o, wagers: [...o.wagers, entry] } : o)),
                notThat: optionId === NOT_THAT_ID ? [...b.notThat, entry] : b.notThat,
                updatedAt: at,
              })),
              chips: t.chips - amount,
            },
      );
      return null;
    },
    [code, table.bets, table.chips, table.closed, update, you],
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
        const settled = settleIfReady(t, proposed, you);
        return { ...replaceBet(t, betId, () => settled.bet), chips: settled.chips };
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
        const settled = settleIfReady(t, confirmed, you);
        return { ...replaceBet(t, betId, () => settled.bet), chips: settled.chips };
      });
    },
    [code, update, you],
  );

  const confirmResolution = useCallback((betId: string) => confirmWith(betId, you), [confirmWith, you]);

  /** Demo only: stands in for a different player confirming. */
  const simulateFriendConfirm = useCallback(
    (betId: string) => {
      const bet = table.bets.find((b) => b.id === betId);
      const friend = DEMO_FRIENDS.find((f) => !bet?.proposal?.confirmedBy.includes(f));
      if (friend) confirmWith(betId, friend);
    },
    [confirmWith, table.bets],
  );

  const cancelProposal = useCallback(
    (betId: string): void => {
      update(code, (t) => replaceBet(t, betId, (b) => ({ ...b, proposal: undefined, updatedAt: tick() })));
    },
    [code, update],
  );

  const closeTable = useCallback((): void => {
    update(code, (t) => ({ ...t, closed: true }));
  }, [code, update]);

  const bets = useMemo(() => [...table.bets].sort((a, b) => b.updatedAt - a.updatedAt), [table.bets]);

  return {
    you,
    isHost: true, // placeholder: whoever opens the table is the host until accounts exist
    chips: table.chips,
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
    closeTable,
  };
}
