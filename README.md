# Bet on anything!

A side project by [Noah Wright](https://noahwright.dev). Make friendly wagers with friends: create a table, share the room code, keep score.

Early work in progress. See [`ROADMAP.todo.md`](./ROADMAP.todo.md) for where it's headed.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 18 + TypeScript
- UI from [`@noahwright/design`](https://github.com/NoahWright87/design): no Tailwind or other CSS framework

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
- `src/components/`: app-specific components (`SiteShell`, `ThemeToggle`, `ChipWidget`)
- `src/data/`: draft game data model (not wired up yet)

## Changelog

### UI basics

- Replaced the `create-next-app` scaffold and Tailwind with `@noahwright/design` (header, footer, hero, cards, inputs, light/dark theme toggle).
- Moved the app from the nested `bet-on-anything/` folder to the repo root.
