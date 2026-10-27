import { registrationEmail, type RegistrationEmail } from "@/emails/registration";

/**
 * Sends the registration to the club. For now a stub: it logs on the server and succeeds.
 * Connecting a provider takes three variables (see README, « Connecting email ») and the call marked TODO.
 */
export async function sendRegistrationEmail(data: RegistrationEmail): Promise<{ ok: boolean; error?: string }> {
  const { subject, text, html } = registrationEmail(data);
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;

  if (!apiKey || !from || !to) {
    console.info("[email:stub] registration", { subject, text, length: html.length });
    return { ok: true };
  }

  // TODO: call the email provider here with { from, to, subject, text, html } and the API key, for example
  // `await fetch("https://api.<provider>.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from, to, subject, text, html }) })`,
  // then return { ok: false, error } when the response isn't ok.
  console.info("[email:stub] provider configured but not connected yet", { subject, to });
  return { ok: true };
}
