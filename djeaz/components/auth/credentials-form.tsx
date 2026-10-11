"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, signUpAction } from "@/features/auth/actions";
import { initialCredentialsState, type CredentialsField } from "@/features/auth/form-state";

type CredentialsFormProps = {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
};

const copy = {
  "sign-in": {
    submit: "Se connecter",
    pending: "Connexion en cours…",
  },
  "sign-up": {
    submit: "Créer mon compte",
    pending: "Inscription en cours…",
  },
} as const;

function AuthField({
  id,
  name,
  label,
  type,
  autoComplete,
  defaultValue,
  error,
  ticket,
  email = false,
}: {
  id: string;
  name: CredentialsField;
  label: string;
  type: "text" | "password";
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  ticket: string;
  email?: boolean;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        key={`${ticket}-${name}`}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        inputMode={email ? "email" : undefined}
        autoCapitalize={email ? "none" : undefined}
        spellCheck={email ? false : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? <FieldError id={errorId} message={error} /> : null}
    </div>
  );
}

export function CredentialsForm({ mode, returnTo }: CredentialsFormProps) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialCredentialsState);
  const labels = copy[mode];

  return (
    <form
      action={formAction}
      noValidate
      aria-labelledby="auth-title"
      aria-describedby="auth-description"
      className="flex min-w-0 flex-col gap-4"
    >
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {state.formError ? <FieldError id="credentials-error" message={state.formError} /> : null}
      <fieldset disabled={pending} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        {mode === "sign-up" ? (
          <AuthField
            id="name"
            name="name"
            label="Nom"
            type="text"
            autoComplete="name"
            defaultValue={state.values.name}
            error={state.fieldErrors.name}
            ticket={state.ticket}
          />
        ) : null}
        <AuthField
          id="email"
          name="email"
          label="Adresse e-mail"
          type="text"
          autoComplete="email"
          email
          defaultValue={state.values.email}
          error={state.fieldErrors.email}
          ticket={state.ticket}
        />
        <AuthField
          id="password"
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          error={state.fieldErrors.password}
          ticket={state.ticket}
        />
        {mode === "sign-up" ? (
          <AuthField
            id="confirm-password"
            name="confirmPassword"
            label="Confirmation du mot de passe"
            type="password"
            autoComplete="new-password"
            error={state.fieldErrors.confirmPassword}
            ticket={state.ticket}
          />
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending ? labels.pending : labels.submit}
        </Button>
      </fieldset>
      <p role="status" aria-live="polite" className="min-h-6 text-sm text-text-secondary">
        {pending ? labels.pending : ""}
      </p>
    </form>
  );
}
