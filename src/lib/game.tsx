"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePlayer } from "./player";

/**
 * Local, in-memory game state: chips and bets per table. It resets on reload.
 * This is the seam the Worker backend replaces (see DATA.todo.md): keep the shape of
 * `useTable` and the pages won't need to change.
 *
 * Placeholder rules: the creator backs a statement with a stake; other players counter
 * (bet against it) with any amount they can afford; the pot is everything staked.
 */

export const STARTING_CHIPS = 1000;
export const MAX_DESCRIPTION_LENGTH = 120;

export type Counter = { id: string; player: string; amount: number };

export type Bet = {
  id: string;
  description: string;
  creator: string;
  stake: number;
  counters: Counter[];
};

export const betPot = (bet: Bet): number =>
  bet.stake + bet.counters.reduce((sum, c) => sum + c.amount, 0);

type TableState = { chips: number; bets: Bet[] };

/** Placeholder bets from other players so a new table isn't empty. Remove once bets are real. */
function sampleBets(): Bet[] {
  return [
    {
      id: "sample-1",
      description: "Dad falls asleep before the second half",
      creator: "Alex Rivera",
      stake: 200,
      counters: [{ id: "sample-1-c1", player: "Sam Patel", amount: 150 }],
    },
    {
      id: "sample-2",
      description: "Grandma wins the next round of cards",
      creator: "Sam Patel",
      stake: 50,
      counters: [],
    },
  ];
}

type GameContextValue = {
  tables: Record<string, TableState>;
  update: (code: string, fn: (t: TableState) => TableState) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

// Shared, never mutated: a table nobody has touched yet renders these same seed bets.
const INITIAL: TableState = { chips: STARTING_CHIPS, bets: sampleBets() };

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Record<string, TableState>>({});

  const update = useCallback((code: string, fn: (t: TableState) => TableState) => {
    setTables((all) => ({ ...all, [code]: fn(all[code] ?? INITIAL) }));
  }, []);

  const value = useMemo(() => ({ tables, update }), [tables, update]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

let counterSeq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counterSeq++}`;

const isStake = (n: number, chips: number) => Number.isInteger(n) && n >= 1 && n <= chips;

export function useTable(code: string) {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useTable must be used inside <GameProvider>");
  const { name } = usePlayer();
  const { tables, update } = ctx;
  const table = tables[code] ?? INITIAL;

  
  // Validate against the current snapshot (state updaters run later, so they can't report
  // success), then re-check inside the updater so a stale double-submit can't overspend.
  const placeBet = useCallback(
    (description: string, amount: number): boolean => {
      const text = description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
      if (!text || !isStake(amount, table.chips)) return false;
      update(code, (t) => {
        if (!isStake(amount, t.chips)) return t;
        const bet: Bet = { id: nextId("bet"), description: text, creator: name, stake: amount, counters: [] };
        return { chips: t.chips - amount, bets: [bet, ...t.bets] };
      });
      return true;
    },
    [code, name, table.chips, update],
  );

  const counterBet = useCallback(
    (betId: string, amount: number): boolean => {
      const target = table.bets.find((b) => b.id === betId);
      if (!target || target.creator === name || !isStake(amount, table.chips)) return false;
      update(code, (t) => {
        if (!isStake(amount, t.chips)) return t;
        const counter: Counter = { id: nextId("counter"), player: name, amount };
        return {
          chips: t.chips - amount,
          bets: t.bets.map((b) => (b.id === betId ? { ...b, counters: [...b.counters, counter] } : b)),
        };
      });
      return true;
    },
    [code, name, table.bets, table.chips, update],
  );

  return { you: name, chips: table.chips, bets: table.bets, placeBet, counterBet };
}
