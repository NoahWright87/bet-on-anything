import type { Theme } from "@noahwright/design";

/**
 * Site-level theme overrides.
 * Tokens not listed here fall back to @noahwright/design defaults (see theme.css).
 * Keep this file minimal — override only what the design system defaults don't cover.
 */
export const theme: Theme = {
  primary: "#D75B1D",
  secondary: "#6E356A",
  foreground: "#2A1328",
  background: "#F2E3F1",
};

export const darkTheme: Theme = {
  primary: "#E8773A",
  secondary: "#A05A9C",
  foreground: "#F2E3F1",
  background: "#1A0A18",
};
