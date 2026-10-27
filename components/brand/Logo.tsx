import { MARK, WORDMARK } from "./paths";

/** The G alone (raster left, vector right, the bar ending on a survey point). */
export function Mark({ size = 32, className = "", title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={MARK.raster} />
      <path d={MARK.top} />
      <path d={MARK.bottom} />
      <path d={MARK.bar} />
      <path d={MARK.point} />
    </svg>
  );
}

/** The horizontal lockup: the G and the outlined B612 wordmark. */
export function Logo({ height = 26 }: { height?: number }) {
  const [, , w, h] = WORDMARK.viewBox.split(" ").map(Number);
  return (
    <span className="logo" role="img" aria-label="Geomatic Club" translate="no">
      <Mark size={height} />
      <svg viewBox={WORDMARK.viewBox} height={height * 0.62} width={(height * 0.62 * w) / h} aria-hidden="true">
        <path d={WORDMARK.d} />
      </svg>
    </span>
  );
}
