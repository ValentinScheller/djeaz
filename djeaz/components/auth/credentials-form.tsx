"use client";

import { useActionState, useLayoutEffect, useRef } from "react";

import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, signUpAction } from "@/features/auth/actions";
import { initialCredentialsState, type CredentialsField } from "@/features/auth/form-state";
import { acceptAuthRedirect } from "@/features/auth/redirect-target";

type CredentialsFormProps = {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  onAuthenticated?: (redirectTo: string) => void;
};

const copy = {
  "sign-in": {
    submit: "Se connecter",
    pending: "Connexion en cours…",
    success: "Connexion réussie…",
  },
  "sign-up": {
    submit: "Créer mon compte",
    pending: "Inscription en cours…",
    success: "Compte créé !",
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

export function CredentialsForm({ mode, returnTo, onAuthenticated }: CredentialsFormProps) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialCredentialsState);
  const labels = copy[mode];
  const succeeded = Boolean(state.redirectTo);
  const locked = pending || succeeded;
  const progress = succeeded ? labels.success : pending ? labels.pending : "";
  const announced = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!state.redirectTo || announced.current === state.redirectTo) {
      return;
    }

    announced.current = state.redirectTo;
    onAuthenticated?.(acceptAuthRedirect(state.redirectTo));
  }, [onAuthenticated, state.redirectTo]);

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
      <fieldset disabled={locked} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        {mode === "sign-up" ? (
          <>
            <AuthField
              id="name"
              name="name"
              label="Nom / Prénom"
              type="text"
              autoComplete="name"
              defaultValue={state.values.name}
              error={state.fieldErrors.name}
              ticket={state.ticket}
            />
            <AuthField
              id="artist-name"
              name="artistName"
              label="Nom d'artiste"
              type="text"
              autoComplete="nickname"
              defaultValue={state.values.artistName}
              error={state.fieldErrors.artistName}
              ticket={state.ticket}
            />
          </>
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
        <Button type="submit" className="w-full" disabled={locked} aria-busy={pending || undefined}>
          {progress || labels.submit}
        </Button>
      </fieldset>
      <p role="status" aria-live="polite" className="min-h-6 text-sm text-text-secondary">
        {progress}
      </p>
    </form>
  );
}
