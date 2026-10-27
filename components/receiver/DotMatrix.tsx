/** « FIX » on a 5×7 dot-matrix, as an LCD shows it: no web font to load for one word. */
const GLYPHS: Record<string, string[]> = {
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
};

export function DotMatrix({ text, dot = 9, className = "" }: { text: string; dot?: number; className?: string }) {
  const chars = text.split("");
  const w = chars.length * 6 - 1;
  return (
    <svg className={className} viewBox={`0 0 ${w * dot} ${7 * dot}`} height={7 * dot} width={w * dot} aria-hidden="true">
      {chars.flatMap((ch, k) =>
        (GLYPHS[ch] ?? []).flatMap((row, y) =>
          row.split("").map((p, x) =>
            p === "#" ? <rect key={`${k}-${x}-${y}`} data-dot x={(k * 6 + x) * dot + 0.6} y={y * dot + 0.6} width={dot - 1.2} height={dot - 1.2} rx={1} /> : null,
          ),
        ),
      )}
    </svg>
  );
}
