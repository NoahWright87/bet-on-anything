import { DurableObject } from "cloudflare:workers";
import { MAX_MESSAGE_BYTES, type ClientMessage, type ServerMessage } from "../../shared/protocol";
import { MAX_NAME_LENGTH, MAX_PLAYERS } from "../../shared/limits";
import { DEFAULT_SETTINGS, type Bet, type TableSettings } from "../../shared/bets";
import { applyAction, type Change, type Env, type TableState } from "../../shared/table";

type Bindings = { TABLE: DurableObjectNamespace<Table> };

/** Per-socket data that survives hibernation (see serializeAttachment). Absent until `join`. */
type Attachment = { name: string };

/**
 * One Durable Object per table (room). The room code is the object's name, so every player who
 * opens the same code reaches the same instance. It is the authority for the game: every action
 * goes through `applyAction` (shared with the app), the result is stored in SQLite, and only the
 * change is broadcast. Sockets use the hibernation API so an idle table costs nothing.
 *
 * A Durable Object handles one message at a time and storage calls here are synchronous, so
 * an action can never interleave with another (no double-spending chips).
 */
export class Table extends DurableObject<Bindings> {
  /** Last activity timestamp handed out; keeps bets' sort order strictly increasing. */
  private lastTick = 0;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS players (
        name_key TEXT PRIMARY KEY,         -- lowercased: names are unique ignoring case
        name TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE         -- secret that lets this browser resume its seat
      );
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        json TEXT NOT NULL,                -- the shared Bet type, serialized
        updated_at INTEGER NOT NULL
      );
      DROP TABLE IF EXISTS participants;
    `); // (participants came from the first stub, before players kept chips)
    // Clients ping every ~30s so they notice a dead connection (phones sleep). The runtime
    // answers for us without waking the object, so this costs nothing while the table is idle.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    const row = ctx.storage.sql.exec<{ t: number | null }>(`SELECT MAX(updated_at) AS t FROM bets`).one();
    this.lastTick = row.t ?? 0;
  }

  // --- RPC, called by the Worker -------------------------------------------------------

  /** Marks the table as created. Returns false if it already exists (room-code collision). */
  create(): boolean {
    if (this.exists()) return false;
    this.setMeta("createdAt", new Date().toISOString());
    return true;
  }

  exists(): boolean {
    return this.getMeta("createdAt") !== null;
  }

  /** Handles the WebSocket upgrade forwarded from the Worker. */
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    if (!this.exists()) return new Response("No such table", { status: 404 });

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  // --- WebSocket handlers --------------------------------------------------------------

  webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): void {
    if ((typeof raw === "string" ? raw.length : raw.byteLength) > MAX_MESSAGE_BYTES) {
      return this.send(ws, { type: "error", message: "Message too large" });
    }
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return this.send(ws, { type: "error", message: "Messages must be JSON" });
    }

    if (msg?.type === "join") return this.join(ws, msg);
    if (msg?.type === "action") return this.act(ws, msg);
    this.send(ws, { type: "error", message: "Unknown message type" });
  }

  // Players (and their chips) stay in the table when they disconnect: closing a socket only
  // stops updates to that browser. Hibernation closes the socket for us, so nothing to clean up.
  webSocketClose(ws: WebSocket): void {
    ws.close();
  }

  webSocketError(ws: WebSocket): void {
    ws.close();
  }

  // --- Game ---------------------------------------------------------------------------

  private join(ws: WebSocket, msg: Extract<ClientMessage, { type: "join" }>): void {
    if (ws.deserializeAttachment()) return this.send(ws, { type: "error", message: "Already joined" });

    const sql = this.ctx.storage.sql;
    const token = typeof msg.token === "string" ? msg.token : "";
    const resumed = token
      ? sql.exec<{ name: string }>(`SELECT name FROM players WHERE token = ?`, token).toArray()[0]
      : undefined;

    let name: string;
    let issued: string;
    let change: Change | null = null;

    if (resumed) {
      name = resumed.name;
      issued = token;
    } else {
      name = String(msg.name ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
      if (!name) return this.send(ws, { type: "join-error", message: "A name is required" });
      if (this.state().players.length >= MAX_PLAYERS) {
        return this.send(ws, { type: "join-error", message: "This table is full" });
      }
      if (sql.exec(`SELECT 1 FROM players WHERE name_key = ?`, name.toLowerCase()).toArray().length > 0) {
        return this.send(ws, { type: "join-error", message: `"${name}" is already at this table` });
      }
      issued = crypto.randomUUID();
      sql.exec(`INSERT INTO players (name_key, name, token) VALUES (?, ?, ?)`, name.toLowerCase(), name, issued);
      change = { joined: name };
      if (!this.getMeta("host")) {
        this.setMeta("host", name); // whoever joins first (the creator, right after POST /api/tables) hosts
        change.host = name;
      }
    }

    ws.serializeAttachment({ name } satisfies Attachment);
    this.send(ws, { type: "welcome", you: name, token: issued, state: this.state() });
    if (change) this.broadcast({ type: "update", change }, ws);
  }

  private act(ws: WebSocket, msg: Extract<ClientMessage, { type: "action" }>): void {
    const me = ws.deserializeAttachment() as Attachment | null;
    if (!me) return this.send(ws, { type: "error", message: "Join the table first" });

    const env: Env = {
      newId: (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`,
      now: () => (this.lastTick = Math.max(Date.now(), this.lastTick + 1)),
    };
    const outcome = applyAction(this.state(), me.name, msg.action, env);
    if (!outcome.ok) return this.send(ws, { type: "error", message: outcome.error });

    this.persist(outcome.change);
    this.broadcast({ type: "update", change: outcome.change });
  }

  // --- Storage ------------------------------------------------------------------------

  private state(): TableState {
    const sql = this.ctx.storage.sql;
    const settings = this.getMeta("settings");
    return {
      host: this.getMeta("host") ?? "",
      players: sql.exec<{ name: string }>(`SELECT name FROM players ORDER BY rowid`).toArray().map((p) => p.name),
      bets: sql.exec<{ json: string }>(`SELECT json FROM bets`).toArray().map((r) => JSON.parse(r.json) as Bet),
      settings: settings ? (JSON.parse(settings) as TableSettings) : DEFAULT_SETTINGS,
      closed: this.getMeta("closed") === "1",
    };
  }

  private persist(change: Change): void {
    if (change.bet) {
      this.ctx.storage.sql.exec(
        `INSERT INTO bets (id, json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
        change.bet.id,
        JSON.stringify(change.bet),
        change.bet.updatedAt,
      );
    }
    if (change.settings) this.setMeta("settings", JSON.stringify(change.settings));
    if (change.closed !== undefined) this.setMeta("closed", change.closed ? "1" : "0");
  }

  private getMeta(key: string): string | null {
    const rows = this.ctx.storage.sql.exec<{ value: string }>(`SELECT value FROM meta WHERE key = ?`, key).toArray();
    return rows[0]?.value ?? null;
  }

  private setMeta(key: string, value: string): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  // --- Sockets ------------------------------------------------------------------------

  private send(ws: WebSocket, msg: ServerMessage): void {
    ws.send(JSON.stringify(msg));
  }

  /** To every joined socket (sockets that haven't joined yet don't see table activity). */
  private broadcast(msg: ServerMessage, except?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except && ws.deserializeAttachment()) this.send(ws, msg);
    }
  }
}
