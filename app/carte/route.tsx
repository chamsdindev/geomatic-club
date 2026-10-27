/* eslint-disable @next/next/no-img-element -- next/og (Satori) draws plain <img> elements */
import { ImageResponse } from "next/og";
import { copy } from "@/lib/copy";
import { fields } from "@/lib/schema";
import { memberPoint, frLat, frLon, frPrecision } from "@/lib/point";
import { countdown, daysUntil, frDate, frTime } from "@/lib/time";
import { cardFonts, fixUri, INK, markUri, RED, SCREEN, staffUri, wordmarkRatio, wordmarkUri, YELLOW } from "@/lib/card";

/**
 * GET /carte?prenom=&nom=&date=&heure= : the member's card, 1080 × 1920 (a story): the receiver showing FIX,
 * the fiche with their point, the logo. Built on demand from the same functions as the page.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const v = { prenom: q.get("prenom") ?? "", nom: q.get("nom") ?? "", date: q.get("date") ?? "", heure: q.get("heure") ?? "" };
  const ok = fields.prenom.safeParse(v.prenom).success && fields.nom.safeParse(v.nom).success
    && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && /^\d{2}:\d{2}$/.test(v.heure);
  if (!ok) return new Response("Paramètres invalides", { status: 400 });
  const prenom = v.prenom.trim(), nom = v.nom.trim();
  const p = memberPoint(prenom, nom, v.date);
  const rows: [string, string][] = [
    [copy.fiche.station, `${prenom} ${nom}`],
    [copy.fiche.coordinates, `${frLat(p.lat)}   ${frLon(p.lon)}`],
    [copy.fiche.epoch, `${frDate(v.date)}, ${frTime(v.heure)}`],
    [copy.fiche.precision, frPrecision(0.012)],
  ];
  const wr = wordmarkRatio();
  const site = new URL(request.url).host;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: YELLOW, color: INK, fontFamily: "B612", padding: "90px 72px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img src={markUri()} width={84} height={84} alt="" />
            <img src={wordmarkUri()} height={52} width={52 * wr} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 30 }}>{copy.receiver}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 56, background: INK, borderRadius: 44, padding: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", background: INK, border: `4px solid ${SCREEN}`, borderRadius: 28, padding: "26px 34px", color: SCREEN }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, borderBottom: `3px solid ${SCREEN}`, paddingBottom: 14 }}>
              <span>14 / 14 satellites</span><span>RTK</span><span>PDOP 0,9</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}>
              <img src={fixUri()} width={340} height={140} alt="" />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 32, gap: 6 }}>
                <span>H {frPrecision(0.012)}</span><span>V {frPrecision(0.018)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
              {copy.lcd.states.map((s) => (
                <div key={s} style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", height: 52, background: SCREEN, color: INK, fontSize: 24, fontWeight: 700 }}>{s}</div>
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 30, marginTop: 24 }}>{copy.lcd.recorded(p.ref)}</div>
          </div>
        </div>
        <div style={{ display: "flex", height: 16, margin: "0 18px", background: INK, borderRadius: 8 }} />

        <div style={{ display: "flex", flexDirection: "column", margin: "0 40px", background: "#FFFFFF", border: `6px solid ${INK}`, borderTop: "0", padding: "40px 44px 44px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 700, borderBottom: `4px solid ${INK}`, paddingBottom: 14 }}>
            <span>{copy.fiche.label}</span><span>{p.ref}</span>
          </div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5, marginTop: 34 }}>{copy.fiche.title(prenom)}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            {rows.map(([k, val]) => (
              <div key={k} style={{ display: "flex", fontSize: 34, borderBottom: `2px solid ${INK}`, padding: "18px 0" }}>
                <span style={{ width: 270 }}>{k}</span><span style={{ flex: 1 }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            <span style={{ fontSize: 28 }}>{copy.fiche.rendezvous}</span>
            <span style={{ fontSize: 64, fontWeight: 700, marginTop: 6 }}>{countdown(v.date, v.heure)}</span>
            <img src={staffUri(daysUntil(v.date, v.heure))} width={768} height={56} style={{ marginTop: 18, border: `3px solid ${INK}` }} alt="" />
            <span style={{ fontSize: 28, marginTop: 16, color: RED, fontWeight: 700 }}>{copy.fiche.keep}</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "center", fontSize: 30 }}>
          <span>{site}</span><span style={{ fontWeight: 700 }}>{copy.clubName}</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: await cardFonts(), headers: { "cache-control": "public, max-age=3600" } },
  );
}
