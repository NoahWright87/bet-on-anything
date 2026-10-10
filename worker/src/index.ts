import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Table } from "./table";

export { Table } from "./table";

type Bindings = {
  TABLE: DurableObjectNamespace<Table>;
  ALLOWED_ORIGINS: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Codes are generated from consonants only (so they can't spell words), but players may
// type any letters, so validation accepts A-Z. Codes are case-insensitive: stored uppercase.
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";
const CODE_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^[A-Z]{${CODE_LENGTH}}$`);

function generateRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CONSONANTS[b % CONSONANTS.length]).join("");
}

function allowedOrigins(env: Bindings): string[] {
  return env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
}

app.use("/api/*", (c, next) =>
  cors({
    origin: (origin) => (allowedOrigins(c.env).includes(origin) ? origin : null),
  })(c, next),
);

app.get("/api/health", (c) => c.json({ ok: true }));

// Create a table. The code is generated here (not by the client) and checked for collisions.
app.post("/api/tables", async (c) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const stub = c.env.TABLE.get(c.env.TABLE.idFromName(code));
    if (await stub.create()) return c.json({ code }, 201);
  }
  return c.json({ error: "Could not allocate a room code, try again" }, 503);
});

// Does this table exist? Lets the UI show "no such table" before opening a socket.
app.get("/api/tables/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!CODE_PATTERN.test(code)) return c.json({ error: "Invalid room code" }, 400);
  const stub = c.env.TABLE.get(c.env.TABLE.idFromName(code));
  return (await stub.exists()) ? c.json({ code }) : c.json({ error: "No such table" }, 404);
});

// Live connection for a table. Browsers don't enforce CORS on WebSockets, so check Origin here.
app.get("/api/tables/:code/ws", async (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!CODE_PATTERN.test(code)) return c.json({ error: "Invalid room code" }, 400);
  if (!allowedOrigins(c.env).includes(c.req.header("Origin") ?? "")) {
    return c.json({ error: "Origin not allowed" }, 403);
  }
  const stub = c.env.TABLE.get(c.env.TABLE.idFromName(code));
  return stub.fetch(c.req.raw);
});

export default app;
