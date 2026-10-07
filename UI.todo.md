# UI follow-ups

Notes from wiring the app to `@noahwright/design`.

## How the integration works

- `src/app/layout.tsx` imports `@noahwright/design/styles.css`, which ships the theme tokens, Wright Sans, and every component's styles.
- The package has no `"use client"` markers, so server components import design-system components via `src/ui.ts` (a client boundary). Components that use hooks directly (`SiteShell`, `ThemeToggle`) import from the package.
- Theme: an inline script in `layout.tsx` sets `data-theme` before first paint (same logic as the package's `initThemeMode`, which would only run after hydration and flash). `ThemeToggle` uses `toggleThemeMode`.
- Internal navigation: `Menu` items use `onClick` + `router.push` (a `MenuItem` `href` renders a plain `<a>`, causing full page loads). Footer links pass `as={NextLink}` to `Link`.

## Sooner

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
