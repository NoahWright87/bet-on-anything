import { LOGO_PARTS, LOGO_PATHS, LOGO_TRANSFORM, LOGO_VIEWBOX } from "../lib/logo";
import "./logo.css";

/**
 * Noah's avatar logo, painted from the live theme (see logo.css), so it
 * switches with light/dark mode. Decorative: the link around it names it.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`logo ${className}`.trim()}
      viewBox={LOGO_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={LOGO_TRANSFORM}>
        {LOGO_PARTS.map((part) => (
          <g key={part} className={`logo__${part}`} fillRule="evenodd">
            {LOGO_PATHS[part].map((d) => (
              <path key={d.slice(0, 24)} d={d} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

