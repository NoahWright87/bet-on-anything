import type { ClientMessage, ServerMessage } from "../../shared/protocol";
import { applyChange, type Action, type TableState } from "../../shared/table";
import { tableSocketUrl, tableUrl } from "./api";
import { getStoredName, getToken, setStoredName, setToken } from "./player";

/**
 * One live connection per table code, shared by every component that calls `useTable(code)`
 * (page, footer, avatar menu) through `subscribeToTable`. Not React: it exposes an immutable
 * `snapshot` that is replaced on every change, which is what `useSyncExternalStore` wants.
 *
 * Lifecycle: check the table exists -> (ask for a name if this device has none) -> open the
 * socket and `join` -> receive the whole table once, then small `update` deltas. If the socket
 * drops (phone asleep, bad signal) it reconnects with backoff and resumes the same seat using
 * the token stored for this table.
 */

export type Status =
  | "idle" // no connection yet (server render, or no table code)
  | "checking" // asking the server whether the table exists
  | "missing" // no such table
  | "needs-name" // waiting for the player to pick a name
  | "connecting" // socket opening / joining for the first time
  | "live" // in the table, getting updates
  | "reconnecting"; // was live, lost the connection; trying again

export type Snapshot = {
  status: Status;
  state: TableState | null; // the whole table, kept current by deltas
  you: string | null; // your name at this table
  nameError: string | null; // why the last name was refused
  notice: string | null; // a message for the player (an action was rejected, we're offline...)
};

export const IDLE: Snapshot = { status: "idle", state: null, you: null, nameError: null, notice: null };

const PING_EVERY_MS = 30_000;
const DEAD_AFTER_MS = 75_000; // no message (a pong counts) for this long: the connection is dead
const GRACE_MS = 5_000; // keep a connection this long after its last user leaves (route changes, Strict Mode)
const BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 15000];

class TableConnection {
  snapshot: Snapshot = { ...IDLE, status: "checking" };
  refs = 0;
  graceTimer: ReturnType<typeof setTimeout> | undefined;

  private listeners = new Set<() => void>();
  private ws: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private lastHeard = 0;
  private attempt = 0;
  private disposed = false;
  private onWake = () => this.wake();

  constructor(readonly code: string) {}

  // --- External store -----------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(patch: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((l) => l());
  }

  // --- Lifecycle ----------------------------------------------------------------------

  async start(): Promise<void> {
    document.addEventListener("visibilitychange", this.onWake);
    window.addEventListener("online", this.onWake);
    try {
      const res = await fetch(tableUrl(this.code));
      if (this.disposed) return;
      if (res.status === 404 || res.status === 400) return this.set({ status: "missing" });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      if (this.disposed) return;
      this.set({ notice: "Can't reach the server. Retrying…" });
      return this.scheduleRetry(() => this.start());
    }
    this.set({ notice: null });
    this.open();
  }

  dispose(): void {
    this.disposed = true;
    clearTimeout(this.retryTimer);
    clearTimeout(this.graceTimer);
    clearInterval(this.pingTimer);
    document.removeEventListener("visibilitychange", this.onWake);
    window.removeEventListener("online", this.onWake);
    this.closeSocket();
    this.listeners.clear();
  }

  /** The player picked a name (or fixed a refused one). */
  setName(name: string): void {
    setStoredName(name);
    this.set({ nameError: null });
    this.open();
  }

  private open(): void {
    if (this.disposed) return;
    const name = getStoredName();
    if (!name && !getToken(this.code)) return this.set({ status: "needs-name" });

    this.closeSocket();
    this.set({ status: this.snapshot.state ? "reconnecting" : "connecting" });

    const ws = new WebSocket(tableSocketUrl(this.code));
    this.ws = ws;
    ws.onopen = () => {
      this.lastHeard = Date.now();
      this.sendRaw({ type: "join", name: name ?? "", token: getToken(this.code) ?? undefined });
      clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => this.ping(), PING_EVERY_MS);
    };
    ws.onmessage = (e) => {
      this.lastHeard = Date.now();
      if (e.data !== "pong") this.handle(JSON.parse(e.data as string) as ServerMessage);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return; // we closed it ourselves on purpose
      this.ws = null;
      clearInterval(this.pingTimer);
      this.set({
        status: this.snapshot.state ? "reconnecting" : "connecting",
        notice: this.snapshot.state ? "Connection lost. Reconnecting…" : this.snapshot.notice,
      });
      this.scheduleRetry(() => this.open());
    };
  }

  private closeSocket(): void {
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  }

  private scheduleRetry(fn: () => void): void {
    clearTimeout(this.retryTimer);
    const delay = BACKOFF_MS[Math.min(this.attempt++, BACKOFF_MS.length - 1)];
    this.retryTimer = setTimeout(fn, delay);
  }

  /** The tab came back or the network returned: don't wait out a long backoff. */
  private wake(): void {
    if (this.disposed || document.visibilityState === "hidden") return;
    if (this.snapshot.status === "reconnecting" || this.snapshot.status === "connecting") {
      clearTimeout(this.retryTimer);
      this.open();
    } else if (this.snapshot.status === "live") {
      this.ping(); // a socket that slept may be dead without knowing it
    }
  }

  private ping(): void {
    if (Date.now() - this.lastHeard > DEAD_AFTER_MS) {
      this.ws?.close(); // onclose starts the reconnect
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
  }

  // --- Messages -----------------------------------------------------------------------

  private handle(msg: ServerMessage): void {
    switch (msg.type) {
      case "welcome":
        this.attempt = 0;
        setToken(this.code, msg.token);
        setStoredName(msg.you);
        this.set({ status: "live", state: msg.state, you: msg.you, notice: null, nameError: null });
        break;
      case "update":
        if (this.snapshot.state) this.set({ state: applyChange(this.snapshot.state, msg.change) });
        break;
      case "join-error":
        this.closeSocket();
        this.set({ status: "needs-name", nameError: msg.message });
        break;
      case "error":
        this.set({ notice: msg.message });
        break;
    }
  }

  private sendRaw(msg: ClientMessage): void {
    this.ws?.send(JSON.stringify(msg));
  }

  /** Sends a player action. Returns an error message to show, or null when it was sent. */
  send(action: Action): string | null {
    if (this.snapshot.status !== "live" || this.ws?.readyState !== WebSocket.OPEN) {
      return "Reconnecting… try again in a moment";
    }
    this.sendRaw({ type: "action", action });
    return null;
  }

  notify(notice: string | null): void {
    this.set({ notice });
  }
}

const connections = new Map<string, TableConnection>();

/** Current snapshot for a table, without opening a connection (IDLE if nobody is subscribed). */
export const peekTable = (code: string): Snapshot => connections.get(code)?.snapshot ?? IDLE;

export const getTableConnection = (code: string): TableConnection | undefined => connections.get(code);

/** Subscribes to a table, opening its connection if this is the first subscriber. */
export function subscribeToTable(code: string, listener: () => void): () => void {
  let conn = connections.get(code);
  if (!conn) {
    conn = new TableConnection(code);
    connections.set(code, conn);
    void conn.start();
  }
  clearTimeout(conn.graceTimer);
  conn.refs++;
  const unsubscribe = conn.subscribe(listener);
  listener(); // the connection may have changed between render and subscribe

  return () => {
    unsubscribe();
    const c = connections.get(code);
    if (!c || --c.refs > 0) return;
    c.graceTimer = setTimeout(() => {
      if (c.refs === 0) {
        c.dispose();
        connections.delete(code);
      }
    }, GRACE_MS);
  };
}

export type { TableConnection };
