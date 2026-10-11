import { z } from "zod";

import type { CredentialsFormState, CredentialsValues } from "./form-state";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

const NAME_MAX_LENGTH = 80;
const ARTIST_NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 254;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis.")
  .max(NAME_MAX_LENGTH, `Le nom ne peut pas dépasser ${NAME_MAX_LENGTH} caractères.`);

export const artistNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom d'artiste est requis.")
  .max(
    ARTIST_NAME_MAX_LENGTH,
    `Le nom d'artiste ne peut pas dépasser ${ARTIST_NAME_MAX_LENGTH} caractères.`,
  );

const emailSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    if (value.length === 0) {
      context.addIssue({ code: "custom", message: "L'adresse e-mail est requise." });
      return;
    }

    if (value.length > EMAIL_MAX_LENGTH) {
      context.addIssue({ code: "custom", message: "L'adresse e-mail est trop longue." });
      return;
    }

    if (!z.email().safeParse(value).success) {
      context.addIssue({ code: "custom", message: "Saisissez une adresse e-mail valide." });
    }
  });

const passwordSchema = z.string().superRefine((value, context) => {
  if (value.length === 0) {
    context.addIssue({ code: "custom", message: "Le mot de passe est requis." });
    return;
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    context.addIssue({
      code: "custom",
      message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    });
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    context.addIssue({
      code: "custom",
      message: `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
    });
  }
});

const signUpSchema = z
  .object({
    name: nameSchema,
    artistName: artistNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.confirmPassword.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirmez le mot de passe.",
      });
      return;
    }

    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas.",
      });
    }
  });

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = {
  name: string;
  artistName: string;
  email: string;
  password: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function valuesFrom(name: string, artistName: string, email: string): CredentialsValues {
  return { name: name.trim(), artistName: artistName.trim(), email: email.trim() };
}

function invalidState(
  error: z.ZodError,
  values: CredentialsValues,
): { ok: false; state: CredentialsFormState } {
  const fieldErrors: CredentialsFormState["fieldErrors"] = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      (field === "name" ||
        field === "artistName" ||
        field === "email" ||
        field === "password" ||
        field === "confirmPassword") &&
      fieldErrors[field] === undefined
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    ok: false,
    state: {
      fieldErrors,
      values,
      ticket: crypto.randomUUID(),
    },
  };
}

export function parseSignUp(
  formData: FormData,
):
  | { ok: true; data: SignUpInput; values: CredentialsValues }
  | { ok: false; state: CredentialsFormState } {
  const values = valuesFrom(
    readField(formData, "name"),
    readField(formData, "artistName"),
    readField(formData, "email"),
  );
  const parsed = signUpSchema.safeParse({
    name: values.name,
    artistName: values.artistName,
    email: values.email,
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, values);
  }

  return {
    ok: true,
    data: {
      name: parsed.data.name,
      artistName: parsed.data.artistName,
      email: parsed.data.email,
      password: parsed.data.password,
    },
    values,
  };
}

export function parseSignIn(
  formData: FormData,
):
  | { ok: true; data: SignInInput; values: CredentialsValues; returnTo: string }
  | { ok: false; state: CredentialsFormState } {
  const values = valuesFrom("", "", readField(formData, "email"));
  const parsed = signInSchema.safeParse({
    email: values.email,
    password: readField(formData, "password"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, values);
  }

  return {
    ok: true,
    data: {
      email: parsed.data.email,
      password: parsed.data.password,
    },
    values,
    returnTo: readField(formData, "returnTo"),
  };
}
