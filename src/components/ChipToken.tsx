/**
 * A poker-chip token with an optional number on it. `outline` makes a hollow chip (used for
 * the "+" add-a-guess chip). Placeholder art: swap the SVG for real chip images later.
 */
export default function ChipToken({
  color,
  label,
  size = 48,
  outline = false,
}: {
  color: string;
  label?: string;
  size?: number;
  outline?: boolean;
}) {
  const ink = outline ? color : "#fff";
  const fontSize = !label ? 0 : label.length <= 2 ? 17 : label.length === 3 ? 14 : 11.5;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="chip-token">
      <circle
        cx="24"
        cy="24"
        r="23"
        fill={outline ? "none" : color}
        stroke={outline ? color : "rgba(0,0,0,0.25)"}
        strokeWidth={outline ? 2 : 1}
        strokeDasharray={outline ? "4 3" : undefined}
      />
      {!outline && (
        <>
          <circle cx="24" cy="24" r="20" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="5.24 5.24" opacity="0.9" />
          <circle cx="24" cy="24" r="15.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.85" />
        </>
      )}
      {label && (
        <text x="24" y="24" textAnchor="middle" dominantBaseline="central" fill={ink} fontSize={fontSize} fontWeight="700" fontFamily="var(--font-family)">
          {label}
        </text>
      )}
    </svg>
  );
}
