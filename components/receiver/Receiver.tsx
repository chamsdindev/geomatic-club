"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { copy } from "@/lib/copy";
import { checkField, FIELD_NAMES, type FieldName } from "@/lib/schema";
import { memberPoint } from "@/lib/point";
import { frDateShort, frTime } from "@/lib/time";
import { initSound, sound } from "@/lib/sound";
import { Field } from "@/components/field/Field";
import { Logo } from "@/components/brand/Logo";
import { Lcd } from "./Lcd";
import { Fiche, type Result } from "./Fiche";
import type { MotionApi } from "./Motion";

// GSAP and its plugins load after the first paint (vercel-react-best-practices: bundle-dynamic-imports).
const Motion = dynamic(() => import("./Motion"), { ssr: false });

type Phase = "form" | "sending" | "fix" | "fiche" | "error";
type Values = Record<FieldName, string>;
const EMPTY: Values = { prenom: "", nom: "", date: "", heure: "" };
const NONE: Record<FieldName, boolean> = { prenom: false, nom: false, date: false, heure: false };
const MIN_SENDING_MS = 1400;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Sends the registration, taking at least MIN_SENDING_MS so the satellites have time to converge. */
async function sendRegistration(payload: Record<string, string>) {
  const started = performance.now();
  let result = { ok: false, status: 0 };
  try {
    const res = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
    result = { ok: res.ok && body.ok === true, status: res.status };
  } catch {}
  await new Promise((r) => setTimeout(r, Math.max(0, MIN_SENDING_MS - (performance.now() - started))));
  return result;
}

export function Receiver() {
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<MotionApi | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState(NONE);
  const [submitted, setSubmitted] = useState(false);
  const [site, setSite] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState("");

  const errors = useMemo(() => Object.fromEntries(FIELD_NAMES.map((f) => [f, checkField(f, values)])) as Values, [values]);
  const validCount = FIELD_NAMES.filter((f) => !errors[f]).length;
  const shown = (f: FieldName) => (touched[f] || submitted ? errors[f] : "");
  const missing = FIELD_NAMES.filter((f) => errors[f]).map((f) => copy.missingNames[f]);

  useEffect(() => initSound(), []);

  // The receiver follows each field's validity: satellites acquired or lost, the status climbs or falls.
  const validity = useRef(NONE);
  useEffect(() => {
    FIELD_NAMES.forEach((f, k) => {
      const ok = !errors[f];
      if (ok !== validity.current[f]) {
        validity.current = { ...validity.current, [f]: ok };
        apiRef.current?.field(k, ok, validCount);
      }
    });
  }, [errors, validCount]);

  // One handler for each event, for every field: the input's name says which field it is.
  const onChange = (e: { currentTarget: HTMLInputElement }) => { const { name, value } = e.currentTarget; setValues((v) => ({ ...v, [name]: value })); };
  const onBlur = (e: { currentTarget: HTMLInputElement }) => { const { name } = e.currentTarget; setTouched((t) => ({ ...t, [name]: true })); apiRef.current?.listen(null); };
  const onFocus = (e: { currentTarget: HTMLInputElement }) => apiRef.current?.listen(FIELD_NAMES.indexOf(e.currentTarget.name as FieldName));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "sending" || phase === "fix") return;
    setSubmitted(true);
    if (missing.length) {
      apiRef.current?.missing(copy.missing(missing));
      sound.error();
      const first = FIELD_NAMES.find((f) => errors[f]);
      if (first) rootRef.current?.querySelector<HTMLInputElement>(`#${first}`)?.focus();
      return;
    }
    sound.click();
    navigator.vibrate?.(10);
    setFailure("");
    setPhase("sending");
    apiRef.current?.sending();
    const sent = await sendRegistration({ ...values, site });
    if (!sent.ok) {
      setFailure(sent.status === 429 ? copy.tooMany : copy.sendFailed);
      setPhase("error");
      apiRef.current?.fail();
      sound.error();
      return;
    }
    const point = memberPoint(values.prenom, values.nom, values.date);
    setResult({ prenom: values.prenom.trim(), nom: values.nom.trim(), date: values.date, heure: values.heure, ...point });
    setPhase("fix");
    await nextFrame(); // the fiche is in the page before it prints
    await apiRef.current?.fix(point.ref);
    setPhase("fiche");
  }

  async function again() {
    await apiRef.current?.reset();
    validity.current = NONE;
    setValues(EMPTY);
    setTouched(NONE);
    setSubmitted(false);
    setResult(null);
    setPhase("form");
    rootRef.current?.querySelector<HTMLInputElement>("#prenom")?.focus();
  }

  const busy = phase === "sending" || phase === "fix";
  return (
    <div className="instrument" ref={rootRef} data-phase={phase}>
      <header className="top">
        <Logo height={30} />
        <span className="model">{copy.receiver}<span className="screw" aria-hidden="true" /></span>
      </header>
      <h1 className="sr-only">{copy.clubName} : {copy.lead}</h1>

      <Lcd />

      <form className="form" noValidate onSubmit={submit} aria-busy={busy} inert={phase === "fiche" ? true : undefined}>
        <p className="lead">{copy.lead}</p>
        <Field.Root name="prenom" error={shown("prenom")}>
          <Field.Label>{copy.fields.prenom}</Field.Label>
          <Field.Input value={values.prenom} onChange={onChange} onFocus={onFocus} onBlur={onBlur} autoComplete="given-name" enterKeyHint="next" maxLength={50} autoCapitalize="words" spellCheck={false} />
          <Field.Error />
        </Field.Root>
        <Field.Root name="nom" error={shown("nom")}>
          <Field.Label>{copy.fields.nom}</Field.Label>
          <Field.Input value={values.nom} onChange={onChange} onFocus={onFocus} onBlur={onBlur} autoComplete="family-name" enterKeyHint="next" maxLength={50} autoCapitalize="words" spellCheck={false} />
          <Field.Error />
        </Field.Root>
        <div className="pair">
          <Field.Root name="date" error={shown("date")}>
            <Field.Label>{copy.fields.date}</Field.Label>
            <Field.Picker type="date" value={values.date} onChange={onChange} onFocus={onFocus} onBlur={onBlur} display={frDateShort(values.date)} placeholder={copy.fields.choose} autoComplete="off" />
            <Field.Error />
          </Field.Root>
          <Field.Root name="heure" error={shown("heure")}>
            <Field.Label>{copy.fields.heure}</Field.Label>
            <Field.Picker type="time" value={values.heure} step={60} onChange={onChange} onFocus={onFocus} onBlur={onBlur} display={frTime(values.heure)} placeholder={copy.fields.choose} autoComplete="off" />
            <Field.Error />
          </Field.Root>
        </div>
        <div className="hp" aria-hidden="true">
          <label>{copy.fields.honeypot}<input name="site" tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.currentTarget.value)} /></label>
        </div>
        <div className="rod" aria-hidden="true">{FIELD_NAMES.map((f) => <i key={f}><b data-rod={f} /></i>)}</div>
        <p className="missing" aria-live="polite">{submitted && missing.length && phase === "form" ? copy.missing(missing) : ""}</p>
        {phase === "error" ? <p className="failure" role="alert">{failure}</p> : null}
        <button className="key" type="submit" data-key aria-disabled={busy || undefined}>
          <span className="objective" aria-hidden="true"><i data-objective /></span>
          {phase === "sending" ? copy.sending : phase === "error" ? copy.retry : copy.send}
        </button>
        <p className="sr-only" aria-live="polite">{`${validCount} champs valides sur 4`}</p>
      </form>

      <div className="slot" data-slot aria-hidden="true" />
      {result ? <Fiche result={result} onAgain={again} /> : null}
      <Motion apiRef={apiRef} rootRef={rootRef} initial={() => FIELD_NAMES.map((f) => !errors[f])} />
    </div>
  );
}
