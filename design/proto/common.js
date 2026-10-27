// Shared by the three prototypes: French dates, validation, the member's seeded coordinates.
window.GC = (() => {
  const fr = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const frShort = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const SLOT = { start: 8 * 60, end: 18 * 60, step: 30 };
  const isoToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Africa/Tunis" });
  const parse = (iso) => new Date(iso + "T00:00:00Z");
  const fmtDate = (iso) => (iso ? fr.format(parse(iso)) : "");
  const fmtDateShort = (iso) => (iso ? frShort.format(parse(iso)) : "");
  const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h}\u00a0h\u00a0${String(m).padStart(2, "0")}`; };
  const NAME = /^[\p{L}][\p{L}\s'’-]*$/u;
  const rules = {
    prenom: (v) => (!v.trim() ? "Indique ton prénom." : v.trim().length < 2 ? "Au moins 2 lettres." : !NAME.test(v.trim()) ? "Seulement des lettres, des espaces, des tirets ou des apostrophes." : ""),
    nom: (v) => (!v.trim() ? "Indique ton nom." : v.trim().length < 2 ? "Au moins 2 lettres." : !NAME.test(v.trim()) ? "Seulement des lettres, des espaces, des tirets ou des apostrophes." : ""),
    date: (v) => (!v ? "Choisis une date." : v < isoToday() ? "Cette date est passée : choisis aujourd'hui ou plus tard." : ""),
    heure: (v) => { if (!v) return "Choisis une heure."; const [h, m] = v.split(":").map(Number); const t = h * 60 + m; return t < SLOT.start || t > SLOT.end || m % SLOT.step ? "Entre 8 h et 18 h, à l'heure ou à la demie." : ""; },
  };
  const fnv = (s) => { let h = 2166136261; for (const c of s.normalize("NFC")) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function point(prenom, nom, date) {
    const h = fnv(`${prenom} ${nom}|${date}`.toLowerCase());
    const lat = 36.8065 + (((h & 0xffff) / 0xffff) - 0.5) * 0.08;
    const lon = 10.1815 + ((((h >>> 16) & 0xffff) / 0xffff) - 0.5) * 0.1;
    const ref = `GC-${Math.round(lat * 100)}N-${String(Math.round(lon * 100)).padStart(4, "0")}E-${date.slice(5, 7)}${date.slice(8, 10)}`;
    return { lat, lon, ref, seed: fnv(`${prenom} ${nom}`.toLowerCase()) };
  }
  const fmtLat = (v) => `${v.toFixed(4).replace(".", ",")}° N`;
  const fmtLon = (v) => `${v.toFixed(4).replace(".", ",")}° E`;
  function countdown(date, time, now = new Date()) {
    const target = new Date(`${date}T${time}:00+01:00`);
    let mins = Math.max(0, Math.round((target - now) / 60000));
    const d = Math.floor(mins / 1440); mins -= d * 1440; const h = Math.floor(mins / 60); const m = mins % 60;
    if (d > 0) return `dans ${d} jour${d > 1 ? "s" : ""} et ${h} h`;
    if (h > 0) return `dans ${h} h ${String(m).padStart(2, "0")}`;
    return m > 0 ? `dans ${m} min` : "c'est maintenant";
  }
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Wires four fields: validates live once a field has been left, reports each field's state. */
  function wireForm({ form, onState, onSubmit }) {
    const ids = ["prenom", "nom", "date", "heure"]; const touched = {}; const state = {};
    const check = (id, show) => {
      const el = form.querySelector(`#${id}`); const msg = rules[id](el.value);
      const was = state[id]; state[id] = !msg;
      const err = form.querySelector(`#${id}-err`);
      if (err) err.textContent = show || touched[id] ? msg : "";
      el.setAttribute("aria-invalid", msg && (show || touched[id]) ? "true" : "false");
      if (was !== state[id] || show) onState?.(id, !msg, msg, ids.indexOf(id), show || touched[id]);
      return !msg;
    };
    for (const id of ids) {
      const el = form.querySelector(`#${id}`);
      el.addEventListener("input", () => check(id, false));
      el.addEventListener("change", () => { touched[id] = true; check(id, false); });
      el.addEventListener("blur", () => { touched[id] = true; check(id, false); });
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = ids.map((id) => { touched[id] = true; return check(id, true); }).every(Boolean);
      if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
      onSubmit(Object.fromEntries(ids.map((id) => [id, form.querySelector(`#${id}`).value.trim()])));
    });
    return { valid: () => ids.filter((id) => state[id]).length, state };
  }
  /** A tap, Escape, Enter or Space ends the intro. */
  function skippable(tl, root = document) {
    const end = () => { if (tl.isActive() || tl.progress() < 1) tl.progress(1); off(); };
    const key = (e) => { if (["Escape", "Enter", " "].includes(e.key)) end(); };
    const off = () => { root.removeEventListener("pointerdown", end); window.removeEventListener("keydown", key); };
    root.addEventListener("pointerdown", end); window.addEventListener("keydown", key);
    tl.eventCallback("onComplete", off);
  }
  return { fmtDate, fmtDateShort, fmtTime, rules, point, fmtLat, fmtLon, countdown, reduced, wireForm, skippable, isoToday };
})();
