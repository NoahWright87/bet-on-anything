/**
 * Noah's avatar logo: a silhouette with a front-facing poker visor, sunglasses, and chip stacks. Shape
 * data is from Noah's source SVG, preserved for the silhouette and collar; poker details extend it. Original
 * content-credentials metadata is omitted. Colors are not baked in: each part is painted
 * from the site palette, so the logo follows light/dark mode.
 *
 * Used by the header (`components/Logo.tsx`) and the browser/app icons
 * (`app/icon.tsx`, with `app/apple-icon.png` exported from the same shapes).
 */

import type { Theme } from "@noahwright/design";
import { theme, darkTheme } from "./theme";

export const LOGO_VIEWBOX = "45 63 1161 1122";

/** The source paths are drawn in a flipped, 10x-scaled space. */
export const LOGO_TRANSFORM = "translate(0,1254) scale(0.1,-0.1)";

export type LogoPart = "silhouette" | "collar" | "chips" | "chipTops" | "chipDetails" | "glasses" | "lenses" | "reflection" | "visor" | "visorBand";

export const LOGO_PATHS: Record<LogoPart, string[]> = {
  silhouette: [
    "M6075 11749 c-490 -45 -964 -237 -1360 -549 -124 -98 -361 -342 -456 -470 -290 -391 -469 -818 -541 -1290 -15 -101 -17 -531 -4 -798 l9 -184 -115 7 c-138 9 -200 -5 -277 -64 -132 -99 -178 -237 -159 -481 32 -423 248 -957 465 -1151 81 -73 127 -93 229 -97 l93 -4 16 -76 c47 -211 173 -491 301 -672 70 -98 185 -233 263 -307 l44 -42 -6 -152 c-4 -84 -7 -182 -7 -219 l0 -66 -91 -73 c-50 -41 -96 -83 -104 -95 -7 -12 -91 -145 -187 -296 -96 -151 -187 -296 -202 -322 -15 -27 -33 -48 -39 -48 -21 0 -519 -175 -701 -247 -858 -338 -1538 -743 -1875 -1116 -131 -145 -220 -282 -322 -492 -161 -336 -322 -899 -423 -1483 l-23 -132 5659 0 5658 0 -4 23 c-3 12 -15 78 -26 147 -41 239 -138 661 -200 868 -201 677 -417 1019 -860 1367 -99 78 -348 247 -435 295 -33 19 -92 53 -131 76 -103 61 -408 213 -613 304 -243 108 -477 197 -796 301 -148 49 -276 92 -284 97 -7 4 -33 39 -56 77 -23 39 -97 156 -163 260 -66 105 -142 224 -168 266 -46 71 -153 173 -221 208 -23 12 -23 14 -23 228 l0 215 79 84 c208 219 338 413 439 654 37 86 90 256 107 338 l7 32 68 0 c117 0 162 21 265 125 142 142 244 330 345 635 109 329 138 627 77 792 -30 82 -62 126 -130 177 -83 63 -131 74 -271 66 l-119 -6 6 83 c3 46 12 182 18 304 30 535 -51 964 -266 1409 -222 461 -542 831 -951 1098 -292 191 -684 339 -1014 381 -158 21 -395 28 -525 15z",
  ],
  collar: [
    "M4478 5060 l-87 -71 20 -32 c11 -18 93 -139 182 -269 89 -131 313 -460 497 -732 184 -272 337 -494 340 -493 8 3 475 488 477 496 1 3 -77 58 -174 121 -320 210 -604 435 -834 662 -118 116 -264 288 -305 357 -10 17 -21 31 -24 31 -3 0 -44 -32 -92 -70z",
    "M7909 5058 c-196 -289 -617 -659 -1129 -996 -80 -52 -147 -96 -148 -98 -9 -6 23 -43 199 -225 102 -107 204 -214 228 -239 23 -25 45 -40 47 -34 3 6 67 103 144 215 76 112 191 281 254 374 63 94 180 267 261 385 302 442 366 540 360 550 -10 16 -155 130 -165 130 -5 0 -28 -28 -51 -62z",
  ],
  chips: ["M2650 2050 Q3700 1710 4750 2050 L4750 1000 Q3700 660 2650 1000z","M5200 2750 Q6250 2410 7300 2750 L7300 1000 Q6250 660 5200 1000z","M7750 2400 Q8800 2060 9850 2400 L9850 1000 Q8800 660 7750 1000z"],
  chipTops: ["M2650 2050 C2650 2310 4750 2310 4750 2050 C4750 1790 2650 1790 2650 2050z","M5200 2750 C5200 3010 7300 3010 7300 2750 C7300 2490 5200 2490 5200 2750z","M7750 2400 C7750 2660 9850 2660 9850 2400 C9850 2140 7750 2140 7750 2400z"],
  chipDetails: ["M2650 1350 Q3700 1010 4750 1350 L4750 1285 Q3700 945 2650 1285z","M2650 1700 Q3700 1360 4750 1700 L4750 1635 Q3700 1295 2650 1635z","M3530 930 h340 v175 h-340z M2650 1095 l170 -65 v155 l-170 65z M4750 1095 l-170 -65 v155 l170 65z","M3530 1280 h340 v175 h-340z M2650 1445 l170 -65 v155 l-170 65z M4750 1445 l-170 -65 v155 l170 65z","M3530 1630 h340 v175 h-340z M2650 1795 l170 -65 v155 l-170 65z M4750 1795 l-170 -65 v155 l170 65z","M5200 1350 Q6250 1010 7300 1350 L7300 1285 Q6250 945 5200 1285z","M5200 1700 Q6250 1360 7300 1700 L7300 1635 Q6250 1295 5200 1635z","M5200 2050 Q6250 1710 7300 2050 L7300 1985 Q6250 1645 5200 1985z","M5200 2400 Q6250 2060 7300 2400 L7300 2335 Q6250 1995 5200 2335z","M6080 930 h340 v175 h-340z M5200 1095 l170 -65 v155 l-170 65z M7300 1095 l-170 -65 v155 l170 65z","M6080 1280 h340 v175 h-340z M5200 1445 l170 -65 v155 l-170 65z M7300 1445 l-170 -65 v155 l170 65z","M6080 1630 h340 v175 h-340z M5200 1795 l170 -65 v155 l-170 65z M7300 1795 l-170 -65 v155 l170 65z","M6080 1980 h340 v175 h-340z M5200 2145 l170 -65 v155 l-170 65z M7300 2145 l-170 -65 v155 l170 65z","M6080 2330 h340 v175 h-340z M5200 2495 l170 -65 v155 l-170 65z M7300 2495 l-170 -65 v155 l170 65z","M7750 1350 Q8800 1010 9850 1350 L9850 1285 Q8800 945 7750 1285z","M7750 1700 Q8800 1360 9850 1700 L9850 1635 Q8800 1295 7750 1635z","M7750 2050 Q8800 1710 9850 2050 L9850 1985 Q8800 1645 7750 1985z","M8630 930 h340 v175 h-340z M7750 1095 l170 -65 v155 l-170 65z M9850 1095 l-170 -65 v155 l170 65z","M8630 1280 h340 v175 h-340z M7750 1445 l170 -65 v155 l-170 65z M9850 1445 l-170 -65 v155 l170 65z","M8630 1630 h340 v175 h-340z M7750 1795 l170 -65 v155 l-170 65z M9850 1795 l-170 -65 v155 l170 65z","M8630 1980 h340 v175 h-340z M7750 2145 l170 -65 v155 l-170 65z M9850 2145 l-170 -65 v155 l170 65z"],
  lenses: ["M5465 8650 c247 -27 360 -58 386 -107 27 -51 7 -293 -37 -453 -29 -107 -78 -222 -106 -251 -67 -66 -267 -99 -661 -106 -348 -7 -601 13 -762 58 -63 18 -98 62 -123 154 -33 124 -54 297 -56 447 -1 124 1 139 20 165 35 48 178 82 429 103 142 11 780 5 910 -10z m2625 1 c120 -15 240 -40 276 -57 52 -25 59 -51 58 -213 -2 -241 -52 -497 -108 -550 -32 -30 -121 -57 -263 -78 -152 -22 -748 -26 -913 -5 -219 28 -299 57 -343 124 -61 94 -127 385 -127 560 0 93 1 99 28 128 18 20 45 34 86 45 76 19 252 43 397 55 147 11 798 4 909 -9z"],
  reflection: [
    "M4700 8450 l220 0 -390 -520 -180 60z M7490 8450 l260 0 -390 -520 -220 45z",
  ],
  visorBand: [
    "M3470 10050 Q6250 11000 9030 10050 L9030 9660 Q6250 10550 3470 9660z",
  ],
  visor: [
    "M3470 9660 Q6250 10400 9030 9660 L9550 9420 Q6250 8880 2950 9420z",
  ],
  glasses: [
    "M4635 8809 c-321 -17 -622 -68 -840 -142 l-70 -23 2 -115 c4 -179 2 -174 76 -189 71 -14 112 -33 126 -58 5 -10 21 -85 35 -167 51 -293 99 -398 203 -443 191 -82 917 -107 1353 -46 199 27 279 62 335 147 47 72 100 213 146 395 22 85 44 162 49 172 19 35 80 53 191 58 116 5 202 -12 233 -46 9 -11 34 -88 55 -173 45 -180 106 -349 150 -413 59 -86 160 -122 419 -153 109 -12 230 -17 467 -17 575 -1 834 44 899 157 37 64 74 194 102 356 13 80 29 156 34 168 12 30 54 49 132 64 l66 12 6 81 c4 45 9 111 12 147 l6 65 -103 32 c-221 66 -365 94 -601 116 -460 43 -1048 23 -1382 -45 -140 -29 -177 -44 -213 -87 l-32 -37 -224 0 -223 0 -40 41 c-45 48 -90 63 -266 93 -265 46 -765 68 -1103 50z m830 -159 c247 -27 360 -58 386 -107 27 -51 7 -293 -37 -453 -29 -107 -78 -222 -106 -251 -67 -66 -267 -99 -661 -106 -348 -7 -601 13 -762 58 -63 18 -98 62 -123 154 -33 124 -54 297 -56 447 -1 124 1 139 20 165 35 48 178 82 429 103 142 11 780 5 910 -10z m2625 1 c120 -15 240 -40 276 -57 52 -25 59 -51 58 -213 -2 -241 -52 -497 -108 -550 -32 -30 -121 -57 -263 -78 -152 -22 -748 -26 -913 -5 -219 28 -299 57 -343 124 -61 94 -127 385 -127 560 0 93 1 99 28 128 18 20 45 34 86 45 76 19 252 43 397 55 147 11 798 4 909 -9z",
  ],
};

/** Paint order: later parts sit on top. */
export const LOGO_PARTS: LogoPart[] = ["silhouette", "collar", "chips", "chipTops", "chipDetails", "glasses", "lenses", "reflection", "visorBand", "visor"];

/**
 * A standalone SVG document (for the favicon), with each part's color taken
 * from `colors` and optionally swapped for `darkColors` when the browser or OS
 * is in dark mode.
 */
export function logoSvg(
  colors: Record<LogoPart, string>,
  darkColors?: Record<LogoPart, string>,
): string {
  const rule = (c: Record<LogoPart, string>) => LOGO_PARTS.map((p) => `.${p}{fill:${c[p]}}`).join("");
  const style = rule(colors) + (darkColors ? `@media (prefers-color-scheme:dark){${rule(darkColors)}}` : "");
  const groups = LOGO_PARTS.map(
    (part) => `<g class="${part}" fill-rule="evenodd">${LOGO_PATHS[part].map((d) => `<path d="${d}"/>`).join("")}</g>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"><style>${style}</style><g transform="${LOGO_TRANSFORM}">${groups}</g></svg>`;
}

/** Mixes two `#rrggbb` colors; `amount` is the share of `a`. */
function mix(a: string, b: string, amount: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) * amount + channel(b, i) * (1 - amount)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Logo colors for one theme. Purple silhouette, a lighter purple collar, an
 * orange chip stacks and visor, dark lenses, and light frames/reflections. Mirrors the CSS in
 * `Logo.tsx`, which uses the live custom properties instead.
 */
function logoColors(t: Theme): Record<LogoPart, string> {
  const secondary = t.secondary!;
  const background = t.background!;
  return {
    silhouette: secondary,
    collar: mix(secondary, background, 0.55),
    chips: t.primary!,
    chipTops: mix(t.primary!, background, 0.6),
    chipDetails: mix(secondary, background, 0.25),
    glasses: background,
    lenses: mix(secondary, "#1A0A18", 0.2),
    reflection: mix("#F2E3F1", secondary, 0.8),
    visorBand: mix(t.primary!, secondary, 0.65),
    visor: t.primary!,
  };
}

export const LOGO_COLORS = logoColors(theme);
export const LOGO_COLORS_DARK = logoColors(darkTheme);


