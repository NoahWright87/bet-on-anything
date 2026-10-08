# Roadmap

Where this project goes next. Pick items from the top; promote them into real work (and delete them here) as they get done. Related: [`DATA.todo.md`](./DATA.todo.md), [`UI.todo.md`](./UI.todo.md).

## Done

- UI shell on `@noahwright/design`: header with nav menu + theme toggle, footer, hero landing page, placeholder pages.
- Backend stub in `worker/` (Hono + Durable Objects): create table, join over WebSocket, live participant list. Not wired to the UI yet.

## Sooner

- [ ] Decide on the game's actual rules before building more UI. Open questions:
  - Who creates a bet, and who resolves it (table host, vote, or the bettors themselves)?
  - Fixed odds, pari-mutuel pool, or free-form "I'll take that bet"?
  - Are chips play money per table, or does a balance persist across tables?
- [ ] Wire the UI to the Worker so two browsers can share a table (see `DATA.todo.md`).
- [ ] Table page v1: participant list, create a bet, place a bet, resolve a bet.

## Later

- [ ] Display names / lightweight identity (no passwords: pick a name, remembered per device).
- [ ] History page backed by real settled bets.
- [ ] Share flow: copy room code, shareable link, QR code.
- [ ] Deploy (static + serverless likely enough; match how `noahwright.dev` is hosted).

## Backlog

- [ ] Tests: unit tests for payout math, a Playwright smoke test for create/join table.
- [ ] Spectator mode, table chat, bet templates ("will X happen by Friday?").
- [ ] Spec files in the style of the design repo (`specs/*.spec.md` + adjacent `.todo.md`) once the game rules settle.
