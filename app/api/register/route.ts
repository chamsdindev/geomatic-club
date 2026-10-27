import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/schema";
import { memberPoint } from "@/lib/point";
import { allow, clientIp } from "@/lib/rate-limit";
import { sendRegistrationEmail } from "@/lib/email";
import { once, registrationKey } from "@/lib/dedupe";

/**
 * POST /api/register: validate (same schema as the form), check the honeypot and the rate limit, send the email.
 * The same registration within 10 minutes gets the first answer back (lib/dedupe.ts). When Resend's quota is
 * reached the registration is logged whole under EMAIL_QUOTA (to recover from the Vercel logs) and the member
 * still sees the success screen: only the club's notification is late.
 */
export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message; // the first message per field
    return NextResponse.json({ ok: false, error: "invalid", fields }, { status: 422 });
  }
  const data = parsed.data;
  // A bot filled the hidden field: answer like a success, send nothing.
  if (data.site) return NextResponse.json({ ok: true });

  const point = memberPoint(data.prenom, data.nom, data.date);
  const answer = await once(registrationKey(data), async () => {
    const receivedAt = new Date();
    const sent = await sendRegistrationEmail({ ...data, ...point, receivedAt });
    if (sent.ok) return { ok: true, ref: point.ref } as const;
    if (sent.quota) {
      const { prenom, nom, date, heure } = data;
      console.warn(`EMAIL_QUOTA ${JSON.stringify({ prenom, nom, date, heure, ref: point.ref, lat: point.lat, lon: point.lon, receivedAt: receivedAt.toISOString() })}`);
      return { ok: true, ref: point.ref } as const;
    }
    return { ok: false } as const;
  });
  if (!answer.ok) return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, ref: answer.ref });
}
