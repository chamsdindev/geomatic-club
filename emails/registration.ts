import { copy } from "@/lib/copy";
import { frDate, frTime } from "@/lib/time";
import { frLat, frLon } from "@/lib/point";
import type { Registration } from "@/lib/schema";

export type RegistrationEmail = Registration & { ref: string; lat: number; lon: number; receivedAt: Date };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The email the club receives for each registration: subject, plain text and HTML. Dates in French, Tunis time. */
export function registrationEmail(r: RegistrationEmail) {
  const received = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Tunis" }).format(r.receivedAt);
  const rows: [string, string][] = [
    ["Prénom", r.prenom], ["Nom", r.nom], ["Date", frDate(r.date)], ["Heure", frTime(r.heure)],
    ["Code GC", r.ref], ["Coordonnées", `${frLat(r.lat)}  ${frLon(r.lon)}`], ["Reçue le", received],
  ];
  const subject = copy.email.subject(r.prenom, r.nom, frDate(r.date), frTime(r.heure));
  const text = rows.map(([k, v]) => `${k} : ${v}`).join("\n");
  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#F2C230;font-family:Arial,Helvetica,sans-serif;color:#16201A">
<table role="presentation" style="max-width:520px;margin:0 auto;background:#FFFFFF;border:2px solid #16201A;border-collapse:collapse;width:100%">
<tr><td style="padding:16px 20px;border-bottom:2px solid #16201A;font-weight:bold;font-size:14px">Geomatic Club, nouvelle inscription</td></tr>
<tr><td style="padding:16px 20px"><table role="presentation" style="border-collapse:collapse;width:100%;font-size:15px">
${rows.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;border-bottom:1px solid #DCE3D5;color:#4A5249;width:130px">${esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid #DCE3D5">${esc(v)}</td></tr>`).join("")}
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
