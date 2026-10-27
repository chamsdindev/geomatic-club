import { CLUB } from "./config";

/** FNV-1a over the normalised text, then a final avalanche. */
function hash(text: string) {
  let h = 2166136261;
  for (const ch of text.normalize("NFC").toLowerCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return h >>> 0;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type MemberPoint = { lat: number; lon: number; ref: string };

/**
 * A member's own point near Tunis and their reference, both from the same hash of name and date: the same
 * registration always lands on the same point; another name or another day lands elsewhere.
 */
export function memberPoint(prenom: string, nom: string, date: string): MemberPoint {
  const h = hash(`${prenom.trim()} ${nom.trim()}|${date}`);
  const lat = CLUB.lat + ((h & 0xffff) / 0xffff - 0.5) * 0.08;
  const lon = CLUB.lon + (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 0.1;
  let ref = "";
  let v = h;
  for (let i = 0; i < 4; i++) { ref += CROCKFORD[v & 31]; v >>>= 5; }
  return { lat, lon, ref: `GC-${ref}` };
}

const four = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4, useGrouping: false });
const three = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false });
const one = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });

/** « 36,8245° N », « 10,1666° E », « ± 0,012 m », « 1,8 »: French decimals, non-breaking spaces. */
export const frLat = (v: number) => `${four.format(Math.abs(v))}° ${v >= 0 ? "N" : "S"}`;
export const frLon = (v: number) => `${four.format(Math.abs(v))}° ${v >= 0 ? "E" : "O"}`;
export const frMetres = (v: number) => `${three.format(v)} m`;
export const frPrecision = (v: number) => `± ${three.format(v)} m`;
export const frOne = (v: number) => one.format(v);
