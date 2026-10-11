import type { CredentialsField, CredentialsFormState, CredentialsValues } from "./form-state";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

const RATE_LIMIT_MESSAGE = "Trop de tentatives. Réessayez dans quelques instants.";
const INVALID_CREDENTIALS_MESSAGE = "Adresse e-mail ou mot de passe incorrect.";
const EMAIL_TAKEN_MESSAGE = "Un compte existe déjà avec cette adresse e-mail.";
const INVALID_EMAIL_MESSAGE = "Saisissez une adresse e-mail valide.";

export type AuthFailure =
  | { scope: "form"; message: string }
  | { scope: "field"; field: Extract<CredentialsField, "email" | "password">; message: string };

function diagnosticId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unexpectedFailure(detail: string): AuthFailure {
  const id = diagnosticId();
  console.error(`[auth] ${id} ${detail}`);
  return {
    scope: "form",
    message: `Une erreur inattendue est survenue. Réessayez. Identifiant : ${id}`,
  };
}

export function classifyAuthStatus(status: number, code: string | undefined): AuthFailure {
  if (status === 429) {
    return { scope: "form", message: RATE_LIMIT_MESSAGE };
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return { scope: "form", message: INVALID_CREDENTIALS_MESSAGE };
  }

  if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return { scope: "field", field: "email", message: EMAIL_TAKEN_MESSAGE };
  }

  if (code === "INVALID_EMAIL") {
    return { scope: "field", field: "email", message: INVALID_EMAIL_MESSAGE };
  }

  if (code === "PASSWORD_TOO_SHORT") {
    return {
      scope: "field",
      field: "password",
      message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }

  if (code === "PASSWORD_TOO_LONG") {
    return {
      scope: "field",
      field: "password",
      message: `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
    };
  }

  return unexpectedFailure(`status=${status} code=${code ?? "none"}`);
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    const body = JSON.parse(text) as { code?: unknown };
    return typeof body.code === "string" ? body.code : undefined;
  } catch {
    return undefined;
  }
}

export async function classifyAuthResponse(response: Response): Promise<AuthFailure> {
  const code = await readErrorCode(response);
  return classifyAuthStatus(response.status, code);
}

function thrownStatus(error: unknown): { status: number; code?: string } | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }

  const statusCode = error.statusCode;
  if (typeof statusCode !== "number") {
    return undefined;
  }

  const body = "body" in error ? error.body : undefined;
  const code =
    typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
      ? body.code
      : undefined;

  return { status: statusCode, code };
}

export function classifyThrownAuthError(error: unknown): AuthFailure | undefined {
  const thrown = thrownStatus(error);
  if (!thrown) {
    return undefined;
  }

  return classifyAuthStatus(thrown.status, thrown.code);
}

export function failureState(
  failure: AuthFailure,
  values: CredentialsValues,
): CredentialsFormState {
  return {
    fieldErrors: failure.scope === "field" ? { [failure.field]: failure.message } : {},
    formError: failure.scope === "form" ? failure.message : undefined,
    values,
    ticket: crypto.randomUUID(),
  };
}

export function unexpectedAuthState(
  error: unknown,
  values: CredentialsValues,
): CredentialsFormState {
  const classified = classifyThrownAuthError(error);
  if (classified) {
    return failureState(classified, values);
  }

  const name = error instanceof Error ? error.name : "unknown";
  return failureState(unexpectedFailure(name), values);
}
