"use client";

import { createContext, use, type InputHTMLAttributes, type ReactNode } from "react";

type FieldState = { id: string; errorId: string; error: string };
const FieldContext = createContext<FieldState | null>(null);
const useField = () => {
  const f = use(FieldContext);
  if (!f) throw new Error("Field parts must sit inside <Field.Root>");
  return f;
};

/** One field: a label, an LCD well, its French message. The parts share the id and the error through context. */
function Root({ name, error, className = "", children }: { name: string; error: string; className?: string; children: ReactNode }) {
  return (
    <FieldContext value={{ id: name, errorId: `${name}-err`, error }}>
      <div className={`field ${className}`} data-field={name} data-invalid={error ? "" : undefined}>
        {children}
      </div>
    </FieldContext>
  );
}

function Label({ children }: { children: ReactNode }) {
  const { id } = useField();
  return <label htmlFor={id} className="field-label">{children}</label>;
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { id, errorId, error } = useField();
  return (
    <div className="well">
      <input id={id} name={id} aria-describedby={errorId} aria-invalid={error ? true : undefined} {...props} />
    </div>
  );
}

/** A native date or time input, restyled: the well shows the value the French way, the native picker opens on tap. */
function Picker({ display, placeholder, ...props }: InputHTMLAttributes<HTMLInputElement> & { display: string; placeholder: string }) {
  const { id, errorId, error } = useField();
  return (
    <div className="well well-picker">
      <span className={display ? "picked" : "placeholder"} aria-hidden="true">{display || placeholder}</span>
      <input id={id} name={id} aria-describedby={errorId} aria-invalid={error ? true : undefined} {...props} />
    </div>
  );
}

function Message() {
  const { errorId, error } = useField();
  return <p id={errorId} className="field-error" aria-live="polite">{error}</p>;
}

export const Field = { Root, Label, Input, Picker, Error: Message };
