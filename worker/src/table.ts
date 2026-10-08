import { DurableObject } from "cloudflare:workers";
import { MAX_NAME_LENGTH, type ClientMessage, type Participant, type ServerMessage } from "./protocol";

type Env = { TABLE: DurableObjectNamespace<Table> };

/** Per-socket data that survives hibernation (see serializeAttachment). */
type Attachment = Participant;

/**
 * One Durable Object per table (room). The room code is the object's name, so every
 * player who opens the same code reaches the same instance. State lives in the
 * object's SQLite database; sockets use the hibernation API so an idle table costs nothing.
 */
export class Table extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    `);
  }

  /** Marks the table as created. Returns false if it already exists (room-code collision). */
  create(): boolean {
    const existing = this.ctx.storage.sql.exec(`SELECT 1 FROM meta WHERE key = 'createdAt'`).toArray();
    if (existing.length > 0) return false;
    this.ctx.storage.sql.exec(`INSERT INTO meta (key, value) VALUES ('createdAt', ?)`, new Date().toISOString());
    return true;
  }

  exists(): boolean {
    return this.ctx.storage.sql.exec(`SELECT 1 FROM meta WHERE key = 'createdAt'`).toArray().length > 0;
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

  webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return this.send(ws, { type: "error", message: "Messages must be JSON" });
    }

    if (msg.type === "join") {
      const name = String(msg.name ?? "").trim().slice(0, MAX_NAME_LENGTH);
      if (!name) return this.send(ws, { type: "error", message: "A name is required" });

      const you: Participant = { id: crypto.randomUUID(), name };
      this.ctx.storage.sql.exec(`INSERT INTO participants (id, name) VALUES (?, ?)`, you.id, you.name);
      ws.serializeAttachment(you satisfies Attachment);

      this.send(ws, { type: "welcome", you, participants: this.participants() });
      this.broadcast({ type: "participants", participants: this.participants() }, ws);
    } else {
      this.send(ws, { type: "error", message: "Unknown message type" });
    }
  }

  webSocketClose(ws: WebSocket): void {
    this.leave(ws);
  }

  webSocketError(ws: WebSocket): void {
    this.leave(ws);
  }

  private leave(ws: WebSocket): void {
    const me = ws.deserializeAttachment() as Attachment | null;
    if (!me) return;
    this.ctx.storage.sql.exec(`DELETE FROM participants WHERE id = ?`, me.id);
    this.broadcast({ type: "participants", participants: this.participants() }, ws);
  }

  private participants(): Participant[] {
    return this.ctx.storage.sql.exec<Participant>(`SELECT id, name FROM participants`).toArray();
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    ws.send(JSON.stringify(msg));
  }

  private broadcast(msg: ServerMessage, except?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except) this.send(ws, msg);
    }
  }
}
