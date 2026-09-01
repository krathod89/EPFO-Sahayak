/**
 * CompassLogo — reproduction of the "EPFO Sahayak" compass mark from the
 * Claude Design canvas (design/p/9963dcbc…, EPFO Sahayak Logo.dc.html),
 * traced from its generated SVG (ring r=29, needle 32,10→39,32→32,32 /
 * 32,54→25,32→32,32 on a 64×64 viewBox).
 *
 * Lab-only component — lives outside the shipped landing header. See
 * app/logo-lab/page.tsx for the comparison this supports.
 */
export type CompassColorway = "brand" | "mono" | "reversed";

const COLORWAYS: Record<CompassColorway, { ring: string; tip: string }> = {
  // The canvas's own palette: teal ring/needle-top + amber needle-bottom.
  brand: { ring: "oklch(0.55 0.13 200)", tip: "oklch(0.78 0.13 70)" },
  // Recolored onto this app's existing green accent ramp — no new brand color introduced.
  mono: { ring: "var(--color-accent-600)", tip: "var(--color-accent-500)" },
  // White ring/needle for dark backgrounds; keeps the amber tip as the one accent.
  reversed: { ring: "#ffffff", tip: "oklch(0.78 0.13 70)" },
};

export function CompassMark({
  colorway = "brand",
  size = 40,
  className,
}: {
  colorway?: CompassColorway;
  size?: number;
  className?: string;
}) {
  const { ring, tip } = COLORWAYS[colorway];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx={32} cy={32} r={29} fill="none" stroke={ring} strokeWidth={3} />
      <polygon points="32,10 39,32 32,32" fill={ring} />
      <polygon points="32,54 25,32 32,32" fill={tip} />
      <circle cx={32} cy={32} r={3.2} fill={ring} />
    </svg>
  );
}

export function CompassLogo({
  colorway = "brand",
  size = 40,
  layout = "horizontal",
  wordmarkColor,
  taglineColor,
  className,
}: {
  colorway?: CompassColorway;
  size?: number;
  layout?: "horizontal" | "stacked";
  /** Override the सहायक wordmark color (defaults to near-black, per the source canvas). */
  wordmarkColor?: string;
  /** Override the EPFO SAHAYAK tagline color (defaults to the colorway's ring color). */
  taglineColor?: string;
  className?: string;
}) {
  const { ring } = COLORWAYS[colorway];
  const stacked = layout === "stacked";
  return (
    <div className={`inline-flex items-center gap-3 ${stacked ? "flex-col gap-1.5" : ""} ${className ?? ""}`}>
      <CompassMark colorway={colorway} size={size} />
      <div className={stacked ? "text-center" : ""}>
        <div
          className="font-extrabold leading-none"
          style={{
            fontSize: size * 0.7,
            color: wordmarkColor ?? "oklch(0.22 0.02 250)",
            fontFamily: 'var(--font-devanagari, inherit), "Nirmala UI", sans-serif',
          }}
        >
          सहायक
        </div>
        <div
          className="font-sans font-bold uppercase leading-none mt-1"
          style={{ fontSize: size * 0.22, letterSpacing: "0.22em", color: taglineColor ?? ring }}
        >
          EPFO Sahayak
        </div>
      </div>
    </div>
  );
}
