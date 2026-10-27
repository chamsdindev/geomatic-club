import { z } from "zod";
import { copy } from "./copy";
import { SLOT } from "./config";
import { tunisNow } from "./time";

/** Letters of any script (Latin with accents, Arabic…), their marks, spaces, hyphens and apostrophes. */
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u;
const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

const name = (empty: string) =>
  z.string().trim()
    .min(1, empty)
    .min(2, copy.errors.tooShort)
    .max(50, copy.errors.tooLong)
    .regex(NAME, copy.errors.letters);

export const fields = {
  prenom: name(copy.errors.prenomEmpty),
  nom: name(copy.errors.nomEmpty),
  date: z.string().min(1, copy.errors.dateEmpty).regex(/^\d{4}-\d{2}-\d{2}$/, copy.errors.dateEmpty)
    .refine((d) => d >= tunisNow().date, copy.errors.datePast),
  heure: z.string().min(1, copy.errors.timeEmpty).regex(/^\d{2}:\d{2}$/, copy.errors.timeEmpty)
    .refine((t) => {
      const m = toMinutes(t);
      return m >= toMinutes(SLOT.start) && m <= toMinutes(SLOT.end) && m % SLOT.stepMinutes === 0;
    }, copy.errors.timeSlot),
} as const;

export type FieldName = keyof typeof fields;
export const FIELD_NAMES = Object.keys(fields) as FieldName[];

/** The whole registration, as the client sends it and the server checks it. `site` is the honeypot. */
export const registrationSchema = z
  .object({ ...fields, site: z.string().optional().default("") })
  .superRefine((v, ctx) => {
    const now = tunisNow();
    if (v.date === now.date && toMinutes(v.heure) <= toMinutes(now.time)) {
      ctx.addIssue({ code: "custom", path: ["heure"], message: copy.errors.timePast });
    }
  });

export type Registration = z.infer<typeof registrationSchema>;

/** One field's message, or "" when it's valid (the date/time pair is checked together). */
export function checkField(field: FieldName, values: Partial<Record<FieldName, string>>): string {
  // An empty date or time says so without reading the clock (and the page can prerender).
  if (field === "date" && !values.date) return copy.errors.dateEmpty;
  if (field === "heure" && !values.heure) return copy.errors.timeEmpty;
  const r = fields[field].safeParse(values[field] ?? "");
  if (!r.success) return r.error.issues[0]?.message ?? "";
  if (field === "heure" && values.date) {
    const now = tunisNow();
    if (values.date === now.date && toMinutes(values.heure ?? "") <= toMinutes(now.time)) return copy.errors.timePast;
  }
  return "";
}
