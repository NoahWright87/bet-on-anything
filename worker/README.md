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

**Automatic:** `.github/workflows/deploy-worker.yml` typechecks and tests the Worker on every pull request, and on every push to `main` that touches `worker/` or `shared/` it deploys to Cloudflare once those pass. You can also run it by hand from the Actions tab (use `main`). Wrangler applies the Durable Object migrations in `wrangler.jsonc` as part of the deploy.

**One-time setup:**

1. A free [Cloudflare](https://dash.cloudflare.com/sign-up) account (the Free plan is enough: the Durable Object is SQLite-backed). It needs a `workers.dev` subdomain; if you've deployed any Worker before you already have one, otherwise Cloudflare asks you to pick one the first time (Workers & Pages in the dashboard).
2. An API token: **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** template. Copy it when shown; Cloudflare won't show it again.
3. In GitHub: **repo Settings → Secrets and variables → Actions → New repository secret**, named `CLOUDFLARE_API_TOKEN`, value the token. Secrets are per repo, so another repo's secret isn't shared.
4. Only if a deploy fails asking for an account: add `CLOUDFLARE_ACCOUNT_ID` too (a domain's Overview page, right sidebar, or Workers & Pages overview).
5. After the first deploy, the log prints the Worker's URL, `https://bet-on-anything.<your-subdomain>.workers.dev`. Set it as `NEXT_PUBLIC_API_URL` in Netlify (**Site configuration → Environment variables**) and redeploy the site, since Next bakes it in at build time.
6. Add every origin the site is served from (the Netlify URL, any custom domain) to `ALLOWED_ORIGINS` in `wrangler.jsonc`. It must match exactly, scheme included, and CORS and the WebSocket check both use it.

**By hand:** `npx wrangler login`, then `npm run deploy`.

Netlify deploy previews have their own origin (`deploy-preview-N--<site>.netlify.app`), which is not in `ALLOWED_ORIGINS`, so previews can't talk to the production Worker. Adding preview Workers or a pattern match is a later todo (`DATA.todo.md`).

## Staying in the free tier

Durable Objects are limited to 100k requests/day on the free plan, and every WebSocket message counts. Send small deltas (not the whole table) and keep using the hibernation API (`ctx.acceptWebSocket`); avoid `setTimeout`/`setInterval` in the Durable Object, since timers keep it awake.
