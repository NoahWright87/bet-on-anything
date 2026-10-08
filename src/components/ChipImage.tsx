/** Placeholder art for the player's chips. Replace the SVG with a real image later. */
export default function ChipImage({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="var(--primary)" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--background)" strokeWidth="1.5" />
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="var(--background)"
        strokeWidth="3"
        strokeDasharray="4.08 4.08"
      />
    </svg>
  );
}
