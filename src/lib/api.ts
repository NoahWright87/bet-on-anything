/**
 * Where the Worker lives. Set NEXT_PUBLIC_API_URL for deployed builds (see worker/README.md);
 * locally it defaults to `wrangler dev`.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/+$/, "");

export const tableUrl = (code: string) => `${API_URL}/api/tables/${code}`;

/** WebSocket URL for a table: same host as the API, ws:// or wss:// to match. */
export const tableSocketUrl = (code: string) => `${tableUrl(code).replace(/^http/, "ws")}/ws`;

/** Asks the Worker for a new table. Resolves to the room code, or throws with a message to show. */
export async function createTable(): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/tables`, { method: "POST" });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error("Couldn't create a table. Try again in a moment.");
  const body = (await res.json()) as { code?: string };
  if (!body.code) throw new Error("Couldn't create a table. Try again in a moment.");
  return body.code;
}
