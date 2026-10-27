import { RATE_LIMIT } from "./config";

/**
 * A small per-IP limit kept in memory. It resets when the server instance restarts and isn't shared between
 * instances: enough against a script hammering one function, not a substitute for a real store (Redis, KV).
 */
const hits = new Map<string, number[]>();

export function allow(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(k);
  return true;
}

/** Vercel and most proxies put the client first in x-forwarded-for; x-real-ip as a fallback. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
