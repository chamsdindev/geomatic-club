import { registrationEmail, type RegistrationEmail } from "@/emails/registration";

const RESEND = "https://api.resend.com/emails";

/** What happened: sent, refused for the plan's limit (the registration must still be kept), or failed. */
export type EmailResult = { ok: true } | { ok: false; quota: boolean };

const QUOTA_ERRORS = new Set(["daily_quota_exceeded", "monthly_quota_exceeded"]);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends the registration to the club through Resend (a plain fetch, no SDK). Without EMAIL_API_KEY (local
 * development) it only logs on the server. Resend's answer and the key never leave the server.
 * A 429 is either Resend's per-second limit (several students at once: wait and try again, up to three times) or
 * the plan's daily or monthly quota: then { ok: false, quota: true }, and the caller keeps the registration.
 */
export async function sendRegistrationEmail(data: RegistrationEmail): Promise<EmailResult> {
  const { subject, text, html } = registrationEmail(data);
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;

  if (!apiKey) {
    console.info("[email:log-only] registration", { subject, text });
    return { ok: true };
  }
  if (!from || !to) {
    console.error("[email] EMAIL_FROM or EMAIL_TO is missing");
    return { ok: false, quota: false };
  }

  // the same key on every try: Resend sends once
  const idempotencyKey = `registration-${data.ref}-${data.receivedAt.getTime()}`;
  const body = JSON.stringify({ from, to: [to], subject, text, html });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(RESEND, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const detail = await res.text().catch(() => "");
      let name = "";
      try { name = String((JSON.parse(detail) as { name?: unknown }).name ?? ""); } catch {}
      console.error("[email] Resend refused the email", { status: res.status, name, attempt, detail: detail.slice(0, 500) });
      if (QUOTA_ERRORS.has(name)) return { ok: false, quota: true };
      if (res.status === 429) {
        if (attempt === 3) return { ok: false, quota: true };
        const wait = Number(res.headers.get("retry-after"));
        await pause(Math.min(Number.isFinite(wait) && wait > 0 ? wait * 1000 : 1000, 3000));
        continue;
      }
      if (res.status < 500) return { ok: false, quota: false };
    } catch (e) {
      console.error("[email] Resend unreachable", { attempt, error: e instanceof Error ? e.name : "unknown" });
    }
  }
  return { ok: false, quota: false };
}
