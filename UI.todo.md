# UI follow-ups

Notes from wiring the app to `@noahwright/design`.

## How the integration works

- `src/app/layout.tsx` imports `@noahwright/design/styles.css`, which ships the theme tokens, Wright Sans, and every component's styles.
- The package has no `"use client"` markers, so server components import design-system components via `src/ui.ts` (a client boundary). Components that use hooks directly (`SiteShell`, `ThemeToggle`) import from the package.
- Theme: an inline script in `layout.tsx` sets `data-theme` before first paint (same logic as the package's `initThemeMode`, which would only run after hydration and flash). `ThemeToggle` uses `toggleThemeMode`.
- Internal navigation: `Menu` items use `onClick` + `router.push` (a `MenuItem` `href` renders a plain `<a>`, causing full page loads). Footer links pass `as={NextLink}` to `Link`.

## UX principles

For friends and family playing on their phone while doing something else. Keep every screen focused, very visual, and straightforward. Tuck explanations and background info away (collapsed by default) so people see only what matters to them right now. Design and check at phone width first (about 390px).

## Built so far

- Landing: one panel with two actions and a vertical divider: left 2/3 a centered room-code box (letters only, auto-uppercase, mono font, max 8) with JOIN underneath (disabled until 8 letters); right 1/3 a larger HOST button. A collapsed "What is this?" sits below.
- Header: hamburger nav, title, and an avatar (initials from the player's name) whose menu holds the light/dark toggle. Account controls will go in this menu.
- Table pages swap the site footer for a sticky "in-game dashboard" bar (`TableFooter`): your chips big and left-aligned with no name; every other player right-aligned as a small chip, first name and amount (richest first; wraps, scrolls if the table is big); the room code as a quiet, tappable footnote underneath (tap to copy). More table-specific stats can join the bar later.
- Chip counts use `formatChips`: whole number up to 9,999, then four significant digits with K/M/B/T (999,999 -> "1.000 M"), scientific notation from a quadrillion up. Thresholds are constants at the top of `src/lib/formatChips.ts`.
- The current player is a placeholder in `src/lib/player.ts` ("First Last"); `usePlayer()` is the seam for real data.
- Table page: a full-width BET button opens New bet (title, your guess, stake). Each bet is a full-width card: the title small and out of the way at the top left, the pot at the top right, then a row of **guess chips** (a number on a chip, the guess underneath), a dashed purple `+` chip to add a guess, and "👈 Not that" pinned to the far right. Tapping a chip opens a dialog: who backed it, a bet field, and a tucked-away "Settle this bet". Betting on a guess stacks one more chip in your color; the total is on the front chip. Pending results show a confirm banner; settled bets show trophies, dimmed losers, and what you got. Anything with new activity jumps to the top. The host opens **Table settings** from the avatar menu: house bid percentage and flat minimum, people needed to settle, and Close table. See `RULES.todo.md` for the rules and open questions.
- Bets and chips live in `src/lib/game.tsx` (`GameProvider` + `useTable(code)`) on top of the pure rules in `src/lib/bets.ts`: in-memory per table, reset on reload, seeded with three placeholder bets from other players. A "Demo: a friend confirms" button (`DEMO_MODE` in `game.tsx`) lets one person try the confirm flow alone. The Worker replaces all of this behind the same hook.

## Sooner

- [ ] Real chip image to replace the SVG placeholder in `src/components/ChipImage.tsx`.
- [ ] Polish the bet cards: chips animating into the pot and a short celebration when a bet settles in your favor, a real chip image, a "new activity" glow so changes are noticeable when a bet jumps to the top.
- [ ] Table settings live in a modal opened from the avatar menu (host only). Later: a clearer home for host controls, and for showing players the house-bid rule so "Not that" isn't a mystery.
- [ ] More players than fit: the footer lists others in a small scrolling block. Consider a tappable roster sheet with full names once tables get big.
- [ ] Remove the `DEMO_MODE` demo button when the backend is wired up.
- [ ] Dialogs are the design system's `Modal`, which closes after any action click, so submit buttons live inside the form and the modal's action area is just Cancel/Close. A `Modal` option for no action row or a controlled close would simplify this.
- [ ] More stats in the sticky bar (candidates: your open bets, net winnings this table).
- [ ] Decide whether the room-code box should also strip vowels or just accept any letters (today: any letters; codes are generated from consonants only).

- [ ] Upstream: `Hero` stacks title/tagline/actions, so it can't do the split join/host layout; the landing panel is plain CSS in `globals.css`. A two-region "split hero" or a `Divider` would let this move into the design system.
- [ ] Upstream: `Input` has no prop to style the field itself, so the room-code box restyles `.nw-input__field` from `globals.css` (centered, mono, large, visually hidden label). Props like `align`, `monospace`, `maxLength`, `inputMode`, `autoCapitalize`, and a `hideLabel` would remove that.
- [ ] Upstream: `Avatar` initials are a fixed small size regardless of the `size` prop.
- [ ] Upstream (design repo): add `"use client"` handling to the build so this app doesn't need `src/ui.ts`.
- [ ] Upstream: `MenuItem` could accept an `as` prop like `Link` does, so Next's `<Link>` works for client-side nav.
- [ ] Upstream: `package.json` `types` points at `dist/index.d.ts` but the build emits `index.d.mts`. TypeScript resolves it today; older tooling may not.
- [ ] Favicon and social/OG image (currently the `create-next-app` favicon).
- [ ] Replace the `ChipWidget` placeholder with a real chip stack visual (denominations, colours from the theme tokens).

## Later

- [ ] Mobile pass on the header (nav lives in the hamburger menu; consider `MobileNav` at small widths).
- [ ] Not-found and error pages in the design-system style.
- [ ] Accessibility pass: focus order, `aria-current` on nav, reduced-motion behaviour for the `Heading` `animateIn` effect.

## Backlog

- [ ] Share design tokens with other sites via a `theme.ts` (see the design repo README) if this app ever needs custom colours.
