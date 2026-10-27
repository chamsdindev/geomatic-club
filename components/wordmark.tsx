import { copy } from "@/lib/copy";

/** The triangulation-point symbol of topographic maps: a triangle with a dot at its centre. */
export function TrigGlyph({ size = 30, className = "", hidden = false }: { size?: number; className?: string; hidden?: boolean }) {
  const intro = hidden ? { "data-intro-hide": "" } : {};
  return (
    <svg viewBox="0 0 32 30" width={size} height={(size * 30) / 32} aria-hidden="true" className={className}>
      <path d="M16 3.2 L29 26.8 H3 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="miter" pathLength={1} data-glyph-triangle {...intro} />
      <circle cx="16" cy="18.9" r="2.7" fill="currentColor" data-glyph-dot {...intro} />
    </svg>
  );
}

/**
 * The club's name, in Archivo at its widest. Each letter is its own box so the intro can widen
 * it (scaleX); at rest every transform is gone and the letters are the real expanded glyphs.
 */
export function Wordmark() {
  const letters = Array.from(copy.clubName);
  return (
    <h1 className="wordmark flex items-center gap-2.5 text-ink" data-intro-part="wordmark">
      <TrigGlyph className="wordmark-glyph shrink-0" hidden />
      <span className="sr-only">{copy.clubName}</span>
      <span aria-hidden="true" className="wordmark-text wide">
        {letters.map((ch, i) =>
          ch === " " ? (
            <span key={i} className="wordmark-space" />
          ) : (
            <span key={i} className="wordmark-letter" data-letter data-intro-hide>
              {ch}
            </span>
          ),
        )}
      </span>
    </h1>
  );
}
