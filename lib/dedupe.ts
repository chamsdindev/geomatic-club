import { DUPLICATE_WINDOW_MS } from "./config";

/**
 * The same registration (Prénom + Nom + date + heure) sent twice within 10 minutes, by a double tap, a retry or
 * two tabs, gets the first answer back and sends no second email. Two sends at the same moment share one
 * attempt. Kept in memory, like the rate limit: per server instance.
 */
type Answer = { ok: true; ref: string } | { ok: false };
const done = new Map<string, { answer: Answer; at: number }>();
const running = new Map<string, Promise<Answer>>();

const fold = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
export const registrationKey = (r: { prenom: string; nom: string; date: string; heure: string }) =>
  [fold(r.prenom), fold(r.nom), r.date, r.heure].join("|");

/** Runs `send` once per key in the window; only a success is remembered, so a failed send can be retried. */
export async function once(key: string, send: () => Promise<Answer>, now = Date.now()): Promise<Answer & { duplicate?: true }> {
  const prior = done.get(key);
  if (prior && now - prior.at < DUPLICATE_WINDOW_MS) return { ...prior.answer, duplicate: true };
  const inFlight = running.get(key);
  if (inFlight) return { ...(await inFlight), duplicate: true };

  const attempt = send();
  running.set(key, attempt);
  try {
    const answer = await attempt;
    if (answer.ok) done.set(key, { answer, at: Date.now() });
    return answer;
  } finally {
    running.delete(key);
    if (done.size > 2000) for (const [k, v] of done) if (Date.now() - v.at >= DUPLICATE_WINDOW_MS) done.delete(k);
  }
}
