# Data model and persistence

## Decided

- Room codes are 8 letters, case-insensitive, stored uppercase (the UI uppercases input; the Worker normalizes).
- Backend: Cloudflare Worker + [Hono](https://hono.dev), in `worker/`. Frontend stays on Netlify and calls the Worker's API/WebSocket across origins.
- One Durable Object (`Table`) per room code, SQLite storage, hibernating WebSockets. Stubbed: create table, join, live participant list.
- Stay on the Cloudflare free plan as long as possible (100k Durable Object requests/day, each WebSocket message counts). Send small deltas, never rebroadcast whole tables, no timers inside the Durable Object.

The classes in `src/data/` (`Board`, `Bet`, `BetGroup`, `UserBet`, `User`) are an early sketch of the game model, not used anywhere. Replace them with the types below once the rules are settled.

## Sooner

- [ ] Bets and chips are currently client-side placeholders in `src/lib/game.tsx` (`useTable`); replace its internals with the Worker (state in the `Table` Durable Object, pushed over the WebSocket) and delete the sample bets.
- [ ] Wire the frontend to the Worker: `NEXT_PUBLIC_API_URL`, "Create a table" calls `POST /api/tables`, the table page opens the WebSocket and shows participants. Remove `generateRoomCode` from `src/lib/roomCode.ts` (the Worker already generates codes).
- [ ] Settle terminology: the UI says "table"; the old data model says `Board`. Use "table".
- [ ] Put shared message/data types in one place both `worker/` and the Next app can import (today `worker/src/protocol.ts` is dependency-free for this reason).
- [ ] Money as integer chips, validated in the Durable Object (`MAX_AMOUNT` in `src/constants/Constants.ts` is not enforced anywhere yet; chips display up to scientific notation, so decide whether a cap makes sense).
- [ ] Bets in the `Table` Durable Object: create, counter, resolve. Placeholder rules in the UI today: the creator backs a statement with a stake, others counter with any amount they can afford, the pot is everything staked. Confirm or change these (see `ROADMAP.todo.md`), then validate stakes server-side.
- [ ] Reconnect: a player who refreshes currently rejoins as a new participant. Issue a token on `welcome`, store it in `localStorage`, and let `join` resume by token.
- [ ] Deploy the Worker, set the real `ALLOWED_ORIGINS` (add the Netlify production URL and custom domain), and add deploy-preview origins if previews should talk to it.

## Later

- [ ] Table lifecycle: expire abandoned tables (Durable Object alarms; they don't block hibernation the way timers do, but check before relying on it).
- [ ] History: D1 database for settled bets, written by the `Table` object when a bet resolves. Feeds the History page.
- [ ] Rate-limit table creation per IP (Workers rate limiting binding or a counter in a Durable Object).
- [ ] Tests for the Worker (`@cloudflare/vitest-pool-workers`), starting with the join/leave flow checked by hand today.

## Backlog

- [ ] Optional accounts so balances persist across tables.
- [ ] Observability: Workers logs/analytics once there is real traffic.
