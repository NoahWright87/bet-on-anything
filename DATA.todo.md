# Data model and persistence

## Decided

- Room codes are 8 letters, case-insensitive, stored uppercase (the UI uppercases input; the Worker normalizes).
- Backend: Cloudflare Worker + [Hono](https://hono.dev), in `worker/`. Frontend stays on Netlify and calls the Worker's API/WebSocket across origins.
- One Durable Object (`Table`) per room code, SQLite storage, hibernating WebSockets. Stubbed: create table, join, live participant list.
- Stay on the Cloudflare free plan as long as possible (100k Durable Object requests/day, each WebSocket message counts). Send small deltas, never rebroadcast whole tables, no timers inside the Durable Object.

- The rules, payout math, action validation and WebSocket messages are shared TypeScript in `shared/`, imported by both the app and the Worker. The Durable Object stores players (name + secret token), bets (JSON per bet) and table settings; chips are derived from bets, never stored.
- A player's identity at a table is their name (unique, case-insensitive) plus a token kept in `localStorage`. The first player to join is the host.
- Every action is validated server-side by `applyAction` (`shared/table.ts`); the app dry-runs the same function for instant form errors. Abuse limits live in `shared/limits.ts` (players, bets, guesses, wagers, name/title lengths).

The classes in `src/data/` (`Board`, `Bet`, `BetGroup`, `UserBet`, `User`) are an old sketch of the game model, not used anywhere. Delete them.

## Sooner

- [ ] Settle terminology: the UI says "table"; the old data model says `Board`. Use "table" (goes away with `src/data/`).
- [ ] Chips are integers validated in the Durable Object, but there is no cap on total chips (they can inflate through house bids and display in scientific notation past a quadrillion). Decide whether a cap makes sense. `MAX_AMOUNT` in `shared/limits.ts` only caps the house bid minimum.
- [ ] Spoofing: anyone with the room code and an unused name can sit down, and anyone who clears their browser data loses their seat. Fine for friends; revisit with accounts.
- [ ] Per-connection rate limiting: a client can flood actions on its own table. Messages are size-capped and tables are size-capped, but there is no throttle.
- [ ] Finish the Worker deploy (CI is set up: see `worker/README.md` for the Cloudflare token + GitHub secret), set the real `ALLOWED_ORIGINS` (Netlify production URL and custom domain), and decide whether Netlify deploy previews should talk to it (they have their own origins; a per-PR preview Worker like the VR repo's, or a pattern match in the origin check).

## Later

- [ ] Table lifecycle: expire abandoned tables (Durable Object alarms; they don't block hibernation the way timers do, but check before relying on it).
- [ ] History: D1 database for settled bets, written by the `Table` object when a bet resolves. Feeds the History page.
- [ ] Rate-limit table creation per IP (Workers rate limiting binding or a counter in a Durable Object).
- [ ] Worker tests that run inside the Workers runtime (`@cloudflare/vitest-pool-workers`): the join/resume/broadcast flow. Today the rules are unit-tested (`worker/test/`, `npm test`) and the socket flow was checked by hand against `wrangler dev`.
- [ ] Playwright smoke test for host + join in the app.

## Backlog

- [ ] Optional accounts so balances persist across tables.
- [ ] Observability: Workers logs/analytics once there is real traffic.
