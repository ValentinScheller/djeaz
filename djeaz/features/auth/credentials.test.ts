import { expect, test } from "vitest";

import { parseSignIn, parseSignUp } from "./credentials";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

const password = "phrase-secrete";

function signUpData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

test("refuse un e-mail invalide, un mot de passe hors bornes et une confirmation différente", () => {
  const invalidEmail = parseSignUp(
    signUpData({
      name: "DJ Test",
      artistName: "DJ Nova",
      email: "pas-un-email",
      password,
      confirmPassword: password,
    }),
  );
  expect(invalidEmail.ok).toBe(false);
  if (!invalidEmail.ok) {
    expect(invalidEmail.state.fieldErrors.email).toBe("Saisissez une adresse e-mail valide.");
    expect(invalidEmail.state.values.email).toBe("pas-un-email");
  }

  const shortPassword = parseSignUp(
    signUpData({
      name: "DJ Test",
      artistName: "DJ Nova",
      email: "dj@example.com",
      password: "a".repeat(PASSWORD_MIN_LENGTH - 1),
      confirmPassword: "a".repeat(PASSWORD_MIN_LENGTH - 1),
    }),
  );
  expect(shortPassword.ok).toBe(false);
  if (!shortPassword.ok) {
    expect(shortPassword.state.fieldErrors.password).toBe(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  }

  const longPassword = "b".repeat(PASSWORD_MAX_LENGTH + 1);
  const long = parseSignIn(
    signUpData({
      email: "dj@example.com",
      password: longPassword,
    }),
  );
  expect(long.ok).toBe(false);
  if (!long.ok) {
    expect(long.state.fieldErrors.password).toBe(
      "Le mot de passe ne peut pas dépasser 128 caractères.",
    );
    expect(JSON.stringify(long.state)).not.toContain(longPassword);
  }

  const mismatch = parseSignUp(
    signUpData({
      name: "DJ Test",
      artistName: "DJ Nova",
      email: "dj@example.com",
      password,
      confirmPassword: `${password}x`,
    }),
  );
  expect(mismatch.ok).toBe(false);
  if (!mismatch.ok) {
    expect(mismatch.state.fieldErrors.confirmPassword).toBe(
      "Les mots de passe ne correspondent pas.",
    );
    expect(JSON.stringify(mismatch.state)).not.toContain(password);
    expect(mismatch.state.values).toEqual({
      name: "DJ Test",
      artistName: "DJ Nova",
      email: "dj@example.com",
    });
  }
});

test("signale les champs requis sans renvoyer les mots de passe", () => {
  const signUp = parseSignUp(
    signUpData({
      name: "   ",
      artistName: "   ",
      email: "  ",
      password: "",
      confirmPassword: "",
    }),
  );
  expect(signUp.ok).toBe(false);
  if (!signUp.ok) {
    expect(signUp.state.fieldErrors.name).toBe("Le nom est requis.");
    expect(signUp.state.fieldErrors.artistName).toBe("Le nom d'artiste est requis.");
    expect(signUp.state.fieldErrors.email).toBe("L'adresse e-mail est requise.");
    expect(signUp.state.fieldErrors.password).toBe("Le mot de passe est requis.");
    expect(signUp.state.fieldErrors.confirmPassword).toBe("Confirmez le mot de passe.");
    expect(signUp.state.values).toEqual({ name: "", artistName: "", email: "" });
    expect(signUp.state).not.toHaveProperty("password");
  }

  const signIn = parseSignIn(signUpData({ email: "", password: "" }));
  expect(signIn.ok).toBe(false);
  if (!signIn.ok) {
    expect(signIn.state.fieldErrors.email).toBe("L'adresse e-mail est requise.");
    expect(signIn.state.fieldErrors.password).toBe("Le mot de passe est requis.");
    expect(signIn.state.values).toEqual({ name: "", artistName: "", email: "" });
  }
});

test("valide le nom d'artiste", () => {
  const missing = parseSignUp(
    signUpData({
      name: "Camille Martin",
      email: "dj@example.com",
      password,
      confirmPassword: password,
    }),
  );
  expect(missing.ok).toBe(false);
  if (!missing.ok) {
    expect(missing.state.fieldErrors.artistName).toBe("Le nom d'artiste est requis.");
    expect(missing.state.values).toEqual({
      name: "Camille Martin",
      artistName: "",
      email: "dj@example.com",
    });
  }

  const blank = parseSignUp(
    signUpData({
      name: "Camille Martin",
      artistName: "   ",
      email: "dj@example.com",
      password,
      confirmPassword: password,
    }),
  );
  expect(blank.ok).toBe(false);
  if (!blank.ok) {
    expect(blank.state.fieldErrors.artistName).toBe("Le nom d'artiste est requis.");
    expect(blank.state.values.artistName).toBe("");
  }

  const tooLong = parseSignUp(
    signUpData({
      name: "Camille Martin",
      artistName: "a".repeat(81),
      email: "dj@example.com",
      password,
      confirmPassword: password,
    }),
  );
  expect(tooLong.ok).toBe(false);
  if (!tooLong.ok) {
    expect(tooLong.state.fieldErrors.artistName).toBe(
      "Le nom d'artiste ne peut pas dépasser 80 caractères.",
    );
    expect(tooLong.state.values.artistName).toHaveLength(81);
  }

  const valid = parseSignUp(
    signUpData({
      name: "Camille Martin",
      artistName: "  DJ Nova  ",
      email: "  dj@example.com  ",
      password,
      confirmPassword: password,
    }),
  );
  expect(valid.ok).toBe(true);
  if (valid.ok) {
    expect(valid.data).toEqual({
      name: "Camille Martin",
      artistName: "DJ Nova",
      email: "dj@example.com",
      password,
    });
    expect(valid.values).toEqual({
      name: "Camille Martin",
      artistName: "DJ Nova",
      email: "dj@example.com",
    });
  }
});
