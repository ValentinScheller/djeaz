export type CredentialsValues = {
  name: string;
  artistName: string;
  email: string;
};

export type CredentialsField = "name" | "artistName" | "email" | "password" | "confirmPassword";

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
  values: { name: "", artistName: "", email: "" },
  ticket: "initial",
};

export type SignOutState = {
  formError?: string;
};

export const initialSignOutState: SignOutState = {};
