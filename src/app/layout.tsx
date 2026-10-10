import type { Metadata } from "next";
import "@noahwright/design/styles.css";
import "./globals.css";
import SiteShell from "../components/SiteShell";
import { GameProvider } from "../lib/game";

export const metadata: Metadata = {
  title: "Bet on Anything",
  description: "Make friendly wagers on anything, with friends.",
};

// Applies the saved (or system) theme before first paint so there is no flash.
// Mirrors initThemeMode() from @noahwright/design, which can't run before hydration.
const themeInit = `(function(){try{var m=localStorage.getItem("nw-theme-mode");if(m!=="dark"&&m!=="light"){m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=m}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <GameProvider>
          <SiteShell>{children}</SiteShell>
        </GameProvider>
      </body>
    </html>
  );
}
