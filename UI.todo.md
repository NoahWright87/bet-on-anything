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
- Table pages swap the site footer for a sticky "in-game dashboard" bar (`TableFooter`): room code bottom-left (tap to copy), chip count bottom-right. The middle is empty on purpose, reserved for more table stats.
- Chip counts use `formatChips`: whole number up to 9,999, then four significant digits with K/M/B/T (999,999 -> "1.000 M"), scientific notation from a quadrillion up. Thresholds are constants at the top of `src/lib/formatChips.ts`.
- The current player is a placeholder in `src/lib/player.ts` ("First Last", 1,000 chips); `usePlayer()` is the seam for real data.

## Sooner

- [ ] Real chip image to replace the SVG placeholder in `src/components/ChipImage.tsx`.
- [ ] Table page body: replace the placeholder card with the bets list (visual, big tap targets).
- [ ] More table stats in the middle of the sticky bar (candidates: players at the table, your open bets, net winnings).
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
