# Worker (backend)

Cloudflare Worker built with [Hono](https://hono.dev). Each table (room) is one [Durable Object](https://developers.cloudflare.com/durable-objects/) named by its room code. It is the authority for the game: players, bets, wagers, settling, settings and closing all live in its SQLite storage, and players talk to it over WebSockets (hibernation API, so idle tables cost nothing).

The rules are not in this package: they are in [`../shared`](../shared) (`bets.ts` payout math, `table.ts` action validation, `protocol.ts` messages), which the Next app imports too. The Durable Object just loads state, runs `applyAction`, stores the resulting change and broadcasts it.

This is a separate package from the Next app, so Netlify's build never installs or compiles it.

## Develop

```bash
cd worker
npm install
npm run dev        # http://localhost:8787
npm run typecheck
npm test           # vitest: payout math and every action's validation (pure, no Workers runtime)
```

Local Durable Object state is kept in `.wrangler/` (delete it to reset all tables).

## API

| Route | What it does |
| --- | --- |
| `GET /api/health` | `{ ok: true }` |
| `POST /api/tables` | Creates a table, returns `201 { code }` (8 consonants, generated and collision-checked server-side) |
| `GET /api/tables/:code` | `200` if the table exists, `404` otherwise |
| `GET /api/tables/:code/ws` | WebSocket upgrade into the table's Durable Object |

### WebSocket protocol

Typed in [`../shared/protocol.ts`](../shared/protocol.ts).

1. Client sends `{ type: "join", name, token? }`. A `token` from an earlier visit resumes that player's seat; otherwise `name` must be unused at the table (case-insensitive), or the server answers `join-error` and keeps the socket open for another try. The first player to join is the host.
2. Server answers `welcome { you, token, state }`: the whole table, once. The client stores `token` (per table, in `localStorage`).
3. Client sends `{ type: "action", action }` (create a bet, add a guess, wager, propose/confirm/cancel a result, change settings, close the table). The action is validated by `applyAction`; on success every connected player gets `update { change }` (one bet, or a setting, or a new player), the sender included. On failure only the sender gets `error { message }`.
4. Clients send the text `ping` every ~30s and get `pong` back; the runtime answers without waking the Durable Object, so it costs nothing. A client that hears nothing for ~75s reconnects.

Players stay in the table when they disconnect (their chips are derived from the bets). Identity is the name plus the token: someone who clears their browser data loses their seat at that table.

CORS and the WebSocket `Origin` check use `ALLOWED_ORIGINS` in `wrangler.jsonc`.

## Deploy

```bash
npx wrangler login
npm run deploy
```

Then set `NEXT_PUBLIC_API_URL` in the frontend's build environment (Netlify) to the deployed `*.workers.dev` URL, and add the frontend's origin(s) to `ALLOWED_ORIGINS`.

## Staying in the free tier

Durable Objects are limited to 100k requests/day on the free plan, and every WebSocket message counts. Send small deltas (not the whole table) and keep using the hibernation API (`ctx.acceptWebSocket`); avoid `setTimeout`/`setInterval` in the Durable Object, since timers keep it awake.
