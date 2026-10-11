import type { Theme } from "@noahwright/design";

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function buildBlock(selector: string, theme: Theme): string {
  const entries = Object.entries(theme)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `--${toKebabCase(key)}:${value}`);
  return entries.length > 0 ? `${selector}{${entries.join(";")}}` : "";
}

export function buildThemeCss(theme: Theme, darkTheme?: Theme): string {
  // The dark selector must be at least as specific as @noahwright/design's own
  // `:root[data-theme="dark"]` defaults. A bare `[data-theme="dark"]` loses to
  // it, and the site silently falls back to the design system's dark palette.
  return buildBlock(":root", theme) + (darkTheme ? buildBlock(':root[data-theme="dark"]', darkTheme) : "");
}
