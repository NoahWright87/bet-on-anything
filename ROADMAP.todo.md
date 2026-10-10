# Roadmap

Where this project goes next. Pick items from the top; promote them into real work (and delete them here) as they get done. Related: [`DATA.todo.md`](./DATA.todo.md), [`UI.todo.md`](./UI.todo.md).

## Done

- UI shell on `@noahwright/design`: header with nav menu + theme toggle, footer, hero landing page, placeholder pages.
- Table page mock-up: BET button, multi-guess bet cards with chips, the `+` chip, "Not that" with an automatic house bid, pooled payouts, multi-person confirmation, ties, activity ordering, closing the table. Client-side placeholder state; rules in `RULES.todo.md`.
- Real backend in `worker/` (Hono + Durable Objects): the UI is wired to it, so two browsers share a table live. Server-side validation, names + resume tokens, reconnecting, host-only settings. Rules shared with the app in `shared/`. Unit tests for the rules.

## Sooner

- [ ] Settle the open rules questions in `RULES.todo.md` (the UI mock-up already follows a first draft). Older questions:
  - Who creates a bet, and who resolves it (table host, vote, or the bettors themselves)?
  - Fixed odds, pari-mutuel pool, or free-form "I'll take that bet"?
  - Are chips play money per table, or does a balance persist across tables?
- [ ] Finish the first Worker deploy: add the Cloudflare token as a GitHub secret, then set `NEXT_PUBLIC_API_URL` on Netlify (CI auto-deploys the Worker from `main`; steps in `worker/README.md`).
- [ ] Rooms: a group holds several Tables that share currency.

## Later

- [ ] Change your name, or show who is online (names are fixed per table today).
- [ ] History page backed by real settled bets.
- [ ] Share flow: copy room code, shareable link, QR code.
- [ ] Deploy (static + serverless likely enough; match how `noahwright.dev` is hosted).

## Backlog

- [ ] Tests: unit tests for payout math, a Playwright smoke test for create/join table.
- [ ] Spectator mode, table chat, bet templates ("will X happen by Friday?").
- [ ] Spec files in the style of the design repo (`specs/*.spec.md` + adjacent `.todo.md`) once the game rules settle.
