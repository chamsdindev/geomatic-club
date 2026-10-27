import { copy } from "@/lib/copy";
import { SLOT } from "@/lib/config";

/**
 * The form's layout, plotted by the intro. Step 3 brings validation, the traverse, the sun,
 * the stamp and the send sequence; for now the fields are plain inputs.
 */
export function RegistrationForm() {
  return (
    <form className="registration relative grid gap-5" noValidate>
      <Field id="prenom" label={copy.fields.firstName} type="text" autoComplete="given-name" enterKeyHint="next" />
      <Field id="nom" label={copy.fields.lastName} type="text" autoComplete="family-name" enterKeyHint="next" />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] gap-x-6 gap-y-5">
        <Field id="date" label={copy.fields.date} type="date" />
        <Field id="heure" label={copy.fields.time} type="time" min={SLOT.start} max={SLOT.end} step={SLOT.stepMinutes * 60} />
      </div>
      <button type="button" className="plate mt-3" data-intro-hide>
        <span className="plate-corners" aria-hidden="true" />
        {copy.send}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  ...input
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field" data-field>
      <label htmlFor={id} className="field-label" data-intro-hide>
        {label}
      </label>
      <input id={id} name={id} className="field-input" data-intro-hide {...input} />
      <span className="field-baseline" aria-hidden="true" data-baseline data-intro-hide />
    </div>
  );
}
