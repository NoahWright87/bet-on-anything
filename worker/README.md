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

Three GitHub Actions workflows (`.github/workflows/`):

- **`deploy-worker.yml`**: on every push to `main` that touches `worker/` or `shared/` (or by hand from the Actions tab), typecheck, test and deploy the production Worker, `bet-on-anything`. Wrangler applies the Durable Object migrations in `wrangler.jsonc` as part of the deploy.
- **`preview-worker.yml`**: on every pull request, typecheck and test, then deploy a separate live Worker, `bet-on-anything-pr-<number>`, with its own Durable Object storage, and comment its address on the PR. There is deliberately no path filter: every PR's Netlify preview is built to talk to its own Worker (below), so every PR needs one. Cloudflare's built-in preview URLs don't support Durable Objects, which is why this is a second real Worker. PRs from forks only run the tests (they get no secrets).
- **`cleanup-worker-preview.yml`**: when a PR closes (merged or not), delete its preview Worker.

**Which Worker the site talks to** is decided at build time by `compute-api-url.mjs` (used in `next.config.mjs`) from the variables Netlify sets itself: a deploy preview of PR N talks to `bet-on-anything-pr-N`, any other Netlify build talks to the production Worker, and local dev talks to `wrangler dev`. So there is nothing to configure on Netlify. Set `NEXT_PUBLIC_API_URL` only to override this (it wins). The `workers.dev` subdomain is hardcoded there; update `WORKERS_SUBDOMAIN` if the Cloudflare account ever changes.

**Origins:** the production Worker allows the origins in `ALLOWED_ORIGINS` in `wrangler.jsonc` (exact match, scheme included; add a custom domain here). A preview Worker's list is replaced at deploy time with `http://localhost:3000` and `https://deploy-preview-<N>--<NETLIFY_SITE>.netlify.app`; `NETLIFY_SITE` is set at the top of `preview-worker.yml` and must match the Netlify site's name.

**One-time setup:**

1. A free [Cloudflare](https://dash.cloudflare.com/sign-up) account (the Free plan is enough: the Durable Object is SQLite-backed) with a `workers.dev` subdomain.
2. An API token: **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** template.
3. In GitHub: **repo Settings → Secrets and variables → Actions → New repository secret**, named `CLOUDFLARE_API_TOKEN`. Secrets are per repo.
4. Only if a deploy fails asking for an account: also add `CLOUDFLARE_ACCOUNT_ID` (a domain's Overview page, right sidebar).

**By hand:** `npx wrangler login`, then `npm run deploy`.

## Staying in the free tier

Durable Objects are limited to 100k requests/day on the free plan, and every WebSocket message counts. Send small deltas (not the whole table) and keep using the hibernation API (`ctx.acceptWebSocket`); avoid `setTimeout`/`setInterval` in the Durable Object, since timers keep it awake.
