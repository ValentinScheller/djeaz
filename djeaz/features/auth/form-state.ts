export type CredentialsValues = {
  name: string;
  email: string;
};

export type CredentialsField = "name" | "email" | "password" | "confirmPassword";

export type CredentialsFormState = {
  fieldErrors: Partial<Record<CredentialsField, string>>;
  formError?: string;
  values: CredentialsValues;
  /** Change à chaque échec pour réinitialiser les mots de passe sans les renvoyer. */
  ticket: string;
  /** Destination interne déjà validée. Présente seulement après un succès d'authentification. */
  redirectTo?: string;
};

export const initialCredentialsState: CredentialsFormState = {
  fieldErrors: {},
  values: { name: "", email: "" },
  ticket: "initial",
};

export type SignOutState = {
  formError?: string;
};

export const initialSignOutState: SignOutState = {};
