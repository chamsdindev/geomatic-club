import { registrationEmail, type RegistrationEmail } from "@/emails/registration";

const RESEND = "https://api.resend.com/emails";

/**
 * Sends the registration to the club through Resend (a plain fetch, no SDK). Without EMAIL_API_KEY (local
 * development) it only logs on the server. Resend's answer and the key never leave the server: the caller gets
 * { ok } and the browser a generic failure.
 */
export async function sendRegistrationEmail(data: RegistrationEmail): Promise<{ ok: boolean }> {
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
    return { ok: false };
  }

  // the same key on a retry: Resend sends once
  const idempotencyKey = `registration-${data.ref}-${data.receivedAt.getTime()}`;
  const body = JSON.stringify({ from, to: [to], subject, text, html });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(RESEND, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const detail = await res.text().catch(() => "");
      console.error("[email] Resend refused the email", { status: res.status, attempt, detail: detail.slice(0, 500) });
      // only a busy or failing server is worth a second try
      if (res.status !== 429 && res.status < 500) return { ok: false };
    } catch (e) {
      console.error("[email] Resend unreachable", { attempt, error: e instanceof Error ? e.name : "unknown" });
    }
  }
  return { ok: false };
}
