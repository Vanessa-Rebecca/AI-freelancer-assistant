import { useCallback, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { z } from 'zod';
import { ApiError } from './api.ts';

type Errors = Record<string, string>;

// Collect the first message per field from a Zod error
function toErrors(issues: z.core.$ZodIssue[]): Errors {
  const errors: Errors = {};
  for (const issue of issues) {
    const field = issue.path.join('.');
    errors[field] ??= issue.message;
  }
  return errors;
}

const readValues = (form: HTMLFormElement) => Object.fromEntries(new FormData(form));

function focusFirstError(form: HTMLFormElement, fieldErrors: Errors) {
  const first = Object.keys(fieldErrors)[0];
  const el = first ? form.elements.namedItem(first) : null;
  if (el instanceof HTMLElement) el.focus();
}

/**
 * Small form helper around a shared Zod schema. Inputs stay uncontrolled
 * (no re-render per keystroke, autofill friendly); values are read with
 * FormData from the event's form. Field errors appear after the first
 * submit, then update as each field loses focus.
 */
export function useZodForm<S extends z.ZodType>(
  schema: S,
  onValid: (data: z.output<S>) => Promise<void> | void,
) {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (submitting) return;
    submitted.current = true;
    setFormError(null);

    const result = schema.safeParse(readValues(form));
    if (!result.success) {
      const fieldErrors = toErrors(result.error.issues);
      setErrors(fieldErrors);
      focusFirstError(form, fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onValid(result.data);
    } catch (err) {
      // Server-side validation maps onto fields; anything else goes to the form banner
      if (
        err instanceof ApiError &&
        err.code === 'VALIDATION_ERROR' &&
        Array.isArray(err.details)
      ) {
        const fieldErrors: Errors = {};
        for (const d of err.details as { field: string; message: string }[]) {
          fieldErrors[d.field] ??= d.message;
        }
        setErrors(fieldErrors);
        focusFirstError(form, fieldErrors);
      } else {
        setFormError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Re-check one field when it loses focus, once the user has tried submitting
  const revalidate = useCallback(
    (name: string, form: HTMLFormElement | null) => {
      if (!submitted.current || !form) return;
      const result = schema.safeParse(readValues(form));
      const message = result.success ? undefined : toErrors(result.error.issues)[name];
      setErrors((prev) => {
        if (prev[name] === message) return prev;
        const next = { ...prev };
        if (message) next[name] = message;
        else delete next[name];
        return next;
      });
    },
    [schema],
  );

  // Spread onto an <Input>: <Input {...field('email')} label="Email" />
  const field = (name: string) => ({
    name,
    error: errors[name],
    onBlur: (e: { currentTarget: { form: HTMLFormElement | null } }) =>
      revalidate(name, e.currentTarget.form),
  });

  return { handleSubmit, field, errors, formError, setFormError, submitting };
}
