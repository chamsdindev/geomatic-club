import { copy } from "./copy";
import { TIME_ZONE, UTC_OFFSET } from "./config";

/** Today and now on the club's clock: { date: "2026-10-27", time: "14:05" }. */
export function tunisNow(at = new Date()) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(at);
  const [date, time] = parts.split(" ");
  return { date, time };
}

const longDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const asUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** « samedi 14 novembre 2026 » */
export const frDate = (iso: string) => (iso ? longDate.format(asUtc(iso)) : "");
/** « sam. 14 nov. 2026 » */
export const frDateShort = (iso: string) => (iso ? shortDate.format(asUtc(iso)) : "");
/** « 14 h 30 », with non-breaking spaces */
export function frTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** The moment of the appointment, as a Date. */
export const appointment = (date: string, time: string) => new Date(`${date}T${time}:00${UTC_OFFSET}`);

/** « dans 18 jours et 4 h », « dans 3 h 05 », « dans 12 min », « c'est maintenant » */
export function countdown(date: string, time: string, now = new Date()) {
  let mins = Math.max(0, Math.round((appointment(date, time).getTime() - now.getTime()) / 60000));
  const d = Math.floor(mins / 1440);
  mins -= d * 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (d > 0) return copy.countdown.days(d, h);
  if (h > 0) return copy.countdown.hours(h, m);
  return m > 0 ? copy.countdown.minutes(m) : copy.countdown.now;
}

/** Whole days until the appointment (at least 0). */
export const daysUntil = (date: string, time: string, now = new Date()) =>
  Math.max(0, Math.ceil((appointment(date, time).getTime() - now.getTime()) / 864e5));
