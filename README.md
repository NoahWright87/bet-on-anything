# Bet on anything!

A side project by [Noah Wright](https://noahwright.dev). Make friendly wagers with friends: create a table, share the room code, keep score.

Early work in progress. See [`ROADMAP.todo.md`](./ROADMAP.todo.md) for where it's headed.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 18 + TypeScript
- UI from [`@noahwright/design`](https://github.com/NoahWright87/design): no Tailwind or other CSS framework
- Backend in [`worker/`](./worker): a [Hono](https://hono.dev) app on Cloudflare Workers with a Durable Object per table. It holds the game state and pushes live updates over WebSockets.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

The app talks to the Worker at `NEXT_PUBLIC_API_URL` (default `http://localhost:8787`), so run both while developing:

```bash
cd worker && npm install && npm run dev    # http://localhost:8787
```

The Worker deploys itself from `main` through GitHub Actions (one-time Cloudflare + GitHub setup in [`worker/README.md`](./worker/README.md)). For a deployed frontend (Netlify), set `NEXT_PUBLIC_API_URL` to the Worker's URL and add the site's origin to `ALLOWED_ORIGINS` in `worker/wrangler.jsonc`. See [`worker/README.md`](./worker/README.md).

## Layout

- `src/app/`: routes (`/`, `/table/[id]`, `/history`, `/about`) and global layout
- `src/ui.ts`: client boundary re-exporting the design-system components used by server components
- `src/components/`: app-specific components (`SiteShell`, `UserMenu`, `TableFooter`, `ChipCount`)
- `src/lib/`: the live table (`useTable.ts` over the WebSocket client in `tableClient.ts`), API URL helpers, this device's player name and tokens (`player.ts`), room codes, chip formatting
- `shared/`: code imported by both the app and the Worker: betting rules and payout math (`bets.ts`), the action validator (`table.ts`), WebSocket messages (`protocol.ts`), limits (`limits.ts`)
- `src/data/`: old draft game model (unused, to be deleted)
- `worker/`: backend, a separate package with its own `package.json` (see its README)

## Changelog

### Real backend

- GitHub Actions (`.github/workflows/deploy-worker.yml`): the Worker is typechecked and tested on every PR and auto-deployed to Cloudflare on pushes to `main` that touch `worker/` or `shared/`.
- Tables, players, bets, chips, settling, host settings and closing now live in the Worker's Durable Object, so two browsers share a table in real time. HOST creates a table on the server; JOIN opens it (or shows "No such table").
- First visit asks for a name (unique per table, no passwords). A per-table token in `localStorage` lets a refresh or a dropped connection resume the same seat; the client reconnects on its own.
- Every action is validated server-side by `shared/table.ts` (stakes vs. chips, one confirmation per player, host-only settings, no wagers after settling or closing, size limits). The app runs the same check first so forms still show errors instantly.
- Removed the placeholder sample bets, the demo-confirm button and the in-memory provider.

### Multi-guess bets

- A bet is a question with several guesses (chips), a `+` chip to add more, and an automatic "Not that" backed by the house. House bid (percentage + minimum, set per table), pooled payouts, multi-person confirmation, ties, activity ordering, and closing the table. The sticky footer shows every player's chips. The pure rules are in `shared/bets.ts` (originally `src/lib/bets.ts`); see `RULES.todo.md`.

### Landing, table bar, and avatar menu

- Landing page is now just JOIN (room code) and HOST. Table pages get a sticky bottom bar with the room code and your chips. The light/dark toggle moved into an avatar menu.

### UI basics

- Replaced the `create-next-app` scaffold and Tailwind with `@noahwright/design` (header, footer, hero, cards, inputs, light/dark theme toggle).
- Added a stub backend in `worker/` (Hono + Durable Objects): create a table, join over WebSocket, live participant list.
- Moved the app from the nested `bet-on-anything/` folder to the repo root.
