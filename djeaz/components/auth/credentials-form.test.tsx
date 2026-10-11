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

test("une erreur serveur ne lance pas la transition", async () => {
  const onAuthenticated = vi.fn();
  signInAction.mockResolvedValue({
    fieldErrors: {},
    formError: "Adresse e-mail ou mot de passe incorrect.",
    values: { name: "", email: "dj@example.com" },
    ticket: "echec",
  } satisfies CredentialsFormState);

  render(<CredentialsForm mode="sign-in" onAuthenticated={onAuthenticated} />);
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Adresse e-mail ou mot de passe incorrect.",
  );
  expect(onAuthenticated).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
});

test("un succès verrouille le formulaire et annonce la destination du serveur", async () => {
  const onAuthenticated = vi.fn();
  signInAction.mockResolvedValue({
    fieldErrors: {},
    values: { name: "", email: "dj@example.com" },
    ticket: "authenticated",
    redirectTo: "/dashboard",
  } satisfies CredentialsFormState);

  render(<CredentialsForm mode="sign-in" returnTo="/catalog" onAuthenticated={onAuthenticated} />);
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  expect(await screen.findByRole("button", { name: "Connexion réussie…" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Connexion réussie…");
  expect(onAuthenticated).toHaveBeenCalledTimes(1);
  expect(onAuthenticated).toHaveBeenCalledWith("/dashboard");
  expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
});

test("la connexion reprend la destination interne renvoyée par le serveur", async () => {
  const onAuthenticated = vi.fn();
  signInAction.mockResolvedValue({
    fieldErrors: {},
    values: { name: "", email: "dj@example.com" },
    ticket: "authenticated",
    redirectTo: "/catalog",
  } satisfies CredentialsFormState);

  render(
    <CredentialsForm
      mode="sign-in"
      returnTo="https://evil.example"
      onAuthenticated={onAuthenticated}
    />,
  );
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  await screen.findByRole("button", { name: "Connexion réussie…" });
  expect(onAuthenticated).toHaveBeenCalledTimes(1);
  expect(onAuthenticated).toHaveBeenCalledWith("/catalog");
});

test("une destination invalide retombe sur le dashboard", async () => {
  const onAuthenticated = vi.fn();
  signUpAction.mockResolvedValue({
    fieldErrors: {},
    values: { name: "DJ Test", email: "dj@example.com" },
    ticket: "authenticated",
    redirectTo: "https://evil.example",
  } satisfies CredentialsFormState);

  render(<CredentialsForm mode="sign-up" onAuthenticated={onAuthenticated} />);
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "DJ Test" } });
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.change(screen.getByLabelText("Confirmation du mot de passe"), {
    target: { value: "motdepasse" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

  expect(await screen.findByRole("button", { name: "Compte créé !" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Compte créé !");
  expect(onAuthenticated).toHaveBeenCalledTimes(1);
  expect(onAuthenticated).toHaveBeenCalledWith("/dashboard");
});
