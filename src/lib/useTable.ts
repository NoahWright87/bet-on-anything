"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, chipsOf, type TableSettings } from "../../shared/bets";
import { applyAction, type Action, type Env } from "../../shared/table";
import { IDLE, getTableConnection, peekTable, subscribeToTable, type Status } from "./tableClient";

/**
 * The table as the pages see it: live state from the Worker (see `tableClient.ts`) plus actions.
 * The rules and every check live in `shared/table.ts`, which the Worker enforces. The actions
 * here dry-run the same check against the local copy so a form can show an error right away,
 * then send the action; the result arrives as an update for everyone, you included.
 *
 * Actions return an error message to show the player, or null when sent. Fire-and-forget actions
 * (settling, settings) report a problem through `notice` instead.
 */

export type PlayerSummary = { name: string; chips: number; isYou: boolean };

// The dry run never stores anything, so its ids and clock don't matter.
const DRY_RUN: Env = { newId: (prefix) => `${prefix}-dry`, now: () => 0 };

const noop = () => {};

export function useTable(code: string) {
  const subscribe = useCallback((listener: () => void) => (code ? subscribeToTable(code, listener) : noop), [code]);
  const snap = useSyncExternalStore(
    subscribe,
    () => (code ? peekTable(code) : IDLE),
    () => IDLE,
  );
  const { state, you } = snap;

  /** Dry-runs an action locally, then sends it. */
  const act = useCallback(
    (action: Action): string | null => {
      const conn = getTableConnection(code);
      if (!conn || !state || !you) return "Not connected yet";
      const dry = applyAction(state, you, action, DRY_RUN);
      if (!dry.ok) return dry.error;
      return conn.send(action);
    },
    [code, state, you],
  );

  /** For actions with no form to show an error in. */
  const actOrNotify = useCallback(
    (action: Action): void => {
      const err = act(action);
      if (err) getTableConnection(code)?.notify(err);
    },
    [act, code],
  );

  const createBet = useCallback(
    (title: string, guess: string, amount: number) => act({ type: "createBet", title, guess, amount }),
    [act],
  );
  const addOption = useCallback(
    (betId: string, guess: string, amount: number) => act({ type: "addOption", betId, guess, amount }),
    [act],
  );
  const wager = useCallback(
    (betId: string, optionId: string, amount: number) => act({ type: "wager", betId, optionId, amount }),
    [act],
  );
  const proposeWinner = useCallback(
    (betId: string, optionId: string) => actOrNotify({ type: "proposeWinner", betId, optionId }),
    [actOrNotify],
  );
  const confirmResolution = useCallback((betId: string) => actOrNotify({ type: "confirm", betId }), [actOrNotify]);
  const cancelProposal = useCallback((betId: string) => actOrNotify({ type: "cancelProposal", betId }), [actOrNotify]);
  const updateSettings = useCallback(
    (settings: TableSettings) => actOrNotify({ type: "updateSettings", settings }),
    [actOrNotify],
  );
  const closeTable = useCallback(() => actOrNotify({ type: "closeTable" }), [actOrNotify]);

  const setName = useCallback((name: string) => getTableConnection(code)?.setName(name), [code]);
  const dismissNotice = useCallback(() => getTableConnection(code)?.notify(null), [code]);

  const bets = useMemo(() => [...(state?.bets ?? [])].sort((a, b) => b.updatedAt - a.updatedAt), [state?.bets]);

  // You first, then everyone else by chips (richest first).
  const players: PlayerSummary[] = useMemo(() => {
    if (!state || !you) return [];
    const others = state.players
      .filter((name) => name !== you)
      .map((name) => ({ name, chips: chipsOf(name, state.bets), isYou: false }))
      .sort((a, b) => b.chips - a.chips);
    return [{ name: you, chips: chipsOf(you, state.bets), isYou: true }, ...others];
  }, [state, you]);

  return {
    status: snap.status as Status,
    /** True once the table is loaded (also while reconnecting: the last known state stays on screen). */
    ready: state !== null && you !== null,
    notice: snap.notice,
    nameError: snap.nameError,
    setName,
    dismissNotice,
    you: you ?? "",
    isHost: state !== null && state.host === you,
    chips: state && you ? chipsOf(you, state.bets) : 0,
    players,
    bets,
    settings: state?.settings ?? DEFAULT_SETTINGS,
    closed: state?.closed ?? false,
    createBet,
    addOption,
    wager,
    proposeWinner,
    confirmResolution,
    cancelProposal,
    updateSettings,
    closeTable,
  };
}

