# Data model and persistence

The classes in `src/data/` (`Board`, `Bet`, `BetGroup`, `UserBet`, `User`) are an early sketch and not used by any page yet. They are plain classes with public fields; expect to replace them.

## Sooner

- [ ] Settle terminology: the UI says "table", the data model says `Board`. Pick one.
- [ ] Move to plain serializable types (`type Table = {...}`) rather than classes, so they survive JSON, server actions, and a database.
- [ ] Model money as integer chips, validated against `MAX_AMOUNT` (`src/constants/Constants.ts`) on the server, not only in `ChipWidget`.
- [ ] Choose a backend that supports realtime updates between participants (candidates: Supabase, Firebase, Cloudflare Durable Objects, or a small Postgres + SSE).

## Later

- [ ] Room codes: currently 8 random consonants generated client-side (`generateRoomCode`). Move generation server-side and check for collisions.
- [ ] Table lifecycle: open, closed, expired; clean up abandoned tables.
- [ ] Settled-bet records that feed the History page.

## Backlog

- [ ] Optional accounts so balances persist across tables.
