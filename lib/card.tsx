import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MARK, WORDMARK } from "@/components/brand/paths";

export const INK = "#16201A", YELLOW = "#F2C230", SCREEN = "#DCE3D5", RED = "#D7262E";

/** B612, read once per server instance. */
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]> | null = null;
export function cardFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/B612-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/B612-Bold.ttf")),
  ]).then(([r, b]) => [
    { name: "B612", data: r, weight: 400, style: "normal" },
    { name: "B612", data: b, weight: 700, style: "normal" },
  ]);
  return fontsPromise;
}

const uri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export const markUri = (fill = INK) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="${fill}">${Object.values(MARK).map((d) => `<path d="${d}"/>`).join("")}</svg>`);
export const wordmarkUri = (fill = INK) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORDMARK.viewBox}" fill="${fill}"><path d="${WORDMARK.d}"/></svg>`);
export const wordmarkRatio = () => { const [, , w, h] = WORDMARK.viewBox.split(" ").map(Number); return w / h; };

/** « FIX » on a 5×7 dot-matrix, as the receiver's LCD shows it. */
export function fixUri(fill = SCREEN) {
  const G: Record<string, string[]> = {
    F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  };
  let r = "";
  "FIX".split("").forEach((ch, k) => G[ch].forEach((row, y) => row.split("").forEach((p, x) => {
    if (p === "#") r += `<rect x="${(k * 6 + x) * 10 + 0.7}" y="${y * 10 + 0.7}" width="8.6" height="8.6" rx="1.2"/>`;
  })));
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 70" fill="${fill}">${r}</svg>`);
}

/** The levelling staff: one red or white segment per day left (at most 30). */
export function staffUri(days: number) {
  const n = Math.min(30, Math.max(1, days)); let r = "";
  for (let k = 0; k < 30; k++) {
    if (k < n) r += `<rect x="${k * 12}" y="0" width="12" height="12" fill="${k % 2 ? "#FFFFFF" : RED}"/>`;
    r += `<path d="M${k * 12} 12v${k % 5 ? 4 : 8}" stroke="${INK}"/>`;
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 22" preserveAspectRatio="none"><rect width="360" height="22" fill="#FFFFFF"/>${r}<path d="M0 12H360" stroke="${INK}"/></svg>`);
}
