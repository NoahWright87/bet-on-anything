import { LOGO_COLORS, LOGO_COLORS_DARK, logoSvg } from "../lib/logo";

// Browser-tab favicon: the logo as SVG, recolored for the browser's own
// light/dark mode (the tab strip follows the OS, not the site's toggle).
export const contentType = "image/svg+xml";

export default function Icon() {
  return new Response(logoSvg(LOGO_COLORS, LOGO_COLORS_DARK), {
    headers: { "Content-Type": "image/svg+xml" },
  });
}

