# Bet on anything!

A side project by [Noah Wright](https://noahwright.dev). Make friendly wagers with friends: create a table, share the room code, keep score.

Early work in progress. See [`ROADMAP.todo.md`](./ROADMAP.todo.md) for where it's headed.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 18 + TypeScript
- UI from [`@noahwright/design`](https://github.com/NoahWright87/design): no Tailwind or other CSS framework
- Backend in [`worker/`](./worker): a [Hono](https://hono.dev) app on Cloudflare Workers with a Durable Object per table (not wired to the UI yet)

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Layout

- `src/app/`: routes (`/`, `/table/[id]`, `/history`, `/about`) and global layout
- `src/ui.ts`: client boundary re-exporting the design-system components used by server components
- `src/components/`: app-specific components (`SiteShell`, `UserMenu`, `TableFooter`, `ChipCount`)
- `src/lib/`: betting rules (`bets.ts`), game state (`game.tsx`), room codes, chip formatting, the placeholder player
- `src/data/`: draft game data model (not wired up yet)
- `worker/`: backend, a separate package with its own `package.json` (see its README)

## Changelog

### Multi-guess bets

- A bet is a question with several guesses (chips), a `+` chip to add more, and an automatic "Not that" backed by the house. House bid (percentage + minimum, set per table), pooled payouts, multi-person confirmation, ties, activity ordering, and closing the table. The sticky footer shows every player's chips. State is an in-memory placeholder (`src/lib/game.tsx`) over the pure rules in `src/lib/bets.ts`; see `RULES.todo.md`.

### Landing, table bar, and avatar menu

- Landing page is now just JOIN (room code) and HOST. Table pages get a sticky bottom bar with the room code and your chips. The light/dark toggle moved into an avatar menu.

### UI basics

- Replaced the `create-next-app` scaffold and Tailwind with `@noahwright/design` (header, footer, hero, cards, inputs, light/dark theme toggle).
- Added a stub backend in `worker/` (Hono + Durable Objects): create a table, join over WebSocket, live participant list.
- Moved the app from the nested `bet-on-anything/` folder to the repo root.
