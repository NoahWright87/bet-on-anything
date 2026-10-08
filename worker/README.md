# Worker (backend)

Cloudflare Worker built with [Hono](https://hono.dev). Each table (room) is one [Durable Object](https://developers.cloudflare.com/durable-objects/) named by its room code, holding state in SQLite and talking to players over WebSockets (hibernation API, so idle tables cost nothing).

This is a separate package from the Next app, so Netlify's build never installs or compiles it.

## Develop

```bash
cd worker
npm install
npm run dev        # http://localhost:8787
npm run typecheck
```

## API

| Route | What it does |
| --- | --- |
| `GET /api/health` | `{ ok: true }` |
| `POST /api/tables` | Creates a table, returns `201 { code }` (8 consonants, generated and collision-checked server-side) |
| `GET /api/tables/:code` | `200` if the table exists, `404` otherwise |
| `GET /api/tables/:code/ws` | WebSocket upgrade into the table's Durable Object |

WebSocket messages are typed in [`src/protocol.ts`](./src/protocol.ts). Currently: client sends `{ type: "join", name }`; server replies with `welcome` and broadcasts `participants` on every join/leave.

CORS and the WebSocket `Origin` check use `ALLOWED_ORIGINS` in `wrangler.jsonc`.

## Deploy

```bash
npx wrangler login
npm run deploy
```

Then set the frontend's API URL to the deployed `*.workers.dev` URL and add the frontend's origin to `ALLOWED_ORIGINS`.

## Staying in the free tier

Durable Objects are limited to 100k requests/day on the free plan, and every WebSocket message counts. Send small deltas (not the whole table) and keep using the hibernation API (`ctx.acceptWebSocket`); avoid `setTimeout`/`setInterval` in the Durable Object, since timers keep it awake.
