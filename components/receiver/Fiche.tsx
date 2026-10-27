"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { frLat, frLon, frPrecision, type MemberPoint } from "@/lib/point";
import { countdown, daysUntil, frDate, frDateShort, frTime } from "@/lib/time";

export type Result = MemberPoint & { prenom: string; nom: string; date: string; heure: string };

const cardUrl = (r: Result) => `/carte?${new URLSearchParams({ prenom: r.prenom, nom: r.nom, date: r.date, heure: r.heure })}`;
const fileName = (r: Result) => `geomatic-club-${r.ref.toLowerCase()}.png`;

async function cardFile(r: Result) {
  const res = await fetch(cardUrl(r));
  if (!res.ok) throw new Error("card");
  return new File([await res.blob()], fileName(r), { type: "image/png" });
}
function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** The levelling staff: one segment per day left (at most 30), red and white, numbered every 10 days. */
function Staff({ days }: { days: number }) {
  const n = Math.min(30, Math.max(1, days)), w = 12;
  return (
    <svg className="staff" viewBox="0 0 360 26" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 30 }, (_, k) => (
        <g key={k}>
          {k < n ? <rect data-staff x={k * w} y={0} width={w} height={12} className={k % 2 ? "w" : "r"} /> : null}
          <path d={`M${k * w} 12v${k % 5 ? 4 : 8}`} />
          {k % 10 === 0 && k ? <text x={k * w} y={25} textAnchor="middle">{k} j</text> : null}
        </g>
      ))}
      <path d="M0 12H360" />
    </svg>
  );
}

export function Fiche({ result: r, onAgain }: { result: Result; onAgain: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState<"" | "save" | "share">("");
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function save() {
    setBusy("save");
    try { download(await cardFile(r)); } finally { setBusy(""); }
  }
  async function share() {
    setBusy("share");
    try {
      const file = await cardFile(r);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: copy.clubName, text: copy.fiche.shareText(r.prenom) }).catch(() => {});
      } else download(file);
    } finally { setBusy(""); }
  }

  return (
    <section className="fiche" data-fiche aria-labelledby="fiche-title" tabIndex={-1}>
      <div className="fiche-sec legend"><span>{copy.fiche.label}</span><span translate="no">{r.ref}</span></div>
      <h2 id="fiche-title" className="fiche-sec" data-fiche-title>{copy.fiche.title(r.prenom)}</h2>
      <p className="fiche-sec">{copy.fiche.text(frDate(r.date), frTime(r.heure))}</p>
      <table className="book fiche-sec">
        <tbody>
          <tr><th scope="row">{copy.fiche.station}</th><td>{r.prenom} {r.nom}</td></tr>
          <tr><th scope="row">{copy.fiche.coordinates}</th><td className="num">{frLat(r.lat)}<br />{frLon(r.lon)}</td></tr>
          <tr><th scope="row">{copy.fiche.epoch}</th><td>{frDateShort(r.date)}, {frTime(r.heure)}</td></tr>
          <tr><th scope="row">{copy.fiche.precision}</th><td className="num">{frPrecision(0.012)}</td></tr>
        </tbody>
      </table>
      <div className="count fiche-sec">
        <span>{copy.fiche.rendezvous}</span>
        <b>{countdown(r.date, r.heure, now)}</b>
        <Staff days={daysUntil(r.date, r.heure, now)} />
        <span className="keep">{copy.fiche.keep}</span>
      </div>
      <div className="acts fiche-sec">
        <button type="button" className="key" onClick={save} aria-busy={busy === "save" || undefined}>
          <span className="objective on" aria-hidden="true"><i /></span>{busy === "save" ? copy.fiche.preparing : copy.fiche.save}
        </button>
        <button type="button" className="ghost" onClick={share} aria-busy={busy === "share" || undefined}>{busy === "share" ? copy.fiche.preparing : copy.fiche.share}</button>
        <button type="button" className="again" onClick={onAgain}>{copy.fiche.again}</button>
      </div>
    </section>
  );
}
