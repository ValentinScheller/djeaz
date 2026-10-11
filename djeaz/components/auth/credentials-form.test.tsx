import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { initialCredentialsState, type CredentialsFormState } from "@/features/auth/form-state";

const signInAction = vi.hoisted(() => vi.fn());
const signUpAction = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  signInAction,
  signUpAction,
}));

import { CredentialsForm } from "./credentials-form";

test("la soumission affiche la progression et désactive l'envoi", async () => {
  let finish: (state: CredentialsFormState) => void = () => {};
  signInAction.mockImplementation(
    () =>
      new Promise<CredentialsFormState>((resolve) => {
        finish = resolve;
      }),
  );

  render(<CredentialsForm mode="sign-in" />);
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "motdepasse" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Connexion en cours…" })).toBeDisabled();
  });
  expect(screen.getByRole("status")).toHaveTextContent("Connexion en cours…");

  finish(initialCredentialsState);
});

test("un échec conserve l'e-mail et vide le mot de passe", async () => {
  const password = "phrase-secrete";
  signUpAction.mockResolvedValue({
    fieldErrors: { email: "Un compte existe déjà avec cette adresse e-mail." },
    values: { name: "DJ Test", email: "dj@example.com" },
    ticket: "apres-echec",
  } satisfies CredentialsFormState);

  render(<CredentialsForm mode="sign-up" />);
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "DJ Test" } });
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmation du mot de passe"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Un compte existe déjà avec cette adresse e-mail.",
  );
  expect(screen.getByLabelText("Nom")).toHaveValue("DJ Test");
  expect(screen.getByLabelText("Adresse e-mail")).toHaveValue("dj@example.com");
  expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  expect(screen.getByLabelText("Confirmation du mot de passe")).toHaveValue("");
  expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute("aria-invalid", "true");
});
