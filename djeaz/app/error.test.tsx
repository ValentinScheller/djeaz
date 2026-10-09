import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import RootError from "@/app/error";

test("l'erreur racine affiche un message français, un digest et rappelle reset", () => {
  const reset = vi.fn();
  const error = new Error("SELECT password FROM users WHERE token = 'secret'") as Error & {
    digest?: string;
  };
  error.digest = "1847293847";

  render(<RootError error={error} reset={reset} />);

  expect(screen.getByRole("heading", { name: "Une erreur est survenue." })).toBeInTheDocument();
  expect(screen.getByText("Identifiant de diagnostic")).toBeInTheDocument();
  expect(screen.getByText("1847293847")).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("SELECT");
  expect(document.body).not.toHaveTextContent("password");
  expect(document.body).not.toHaveTextContent("secret");
  expect(document.body).not.toHaveTextContent("stack");

  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(reset).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");
});

test("sans digest, l'identifiant local reste stable et masque le message technique", () => {
  const error = new Error("ECONNREFUSED postgres://user:secret@localhost/djeaz");
  const { rerender } = render(<RootError error={error} reset={vi.fn()} />);

  const diagnosticId = screen.getByText(/^[0-9a-f]{16}$/).textContent;
  expect(diagnosticId).toBeTruthy();
  expect(document.body).not.toHaveTextContent("ECONNREFUSED");
  expect(document.body).not.toHaveTextContent("postgres");
  expect(document.body).not.toHaveTextContent("secret");

  rerender(<RootError error={error} reset={vi.fn()} />);
  expect(screen.getByText(diagnosticId ?? "")).toBeInTheDocument();
});

test("un digest qui ressemble à du SQL n'est pas affiché", () => {
  const error = new Error("échec") as Error & { digest?: string };
  error.digest = "SELECT * FROM sessions";

  render(<RootError error={error} reset={vi.fn()} />);

  expect(screen.getByText(/^[0-9a-f]{16}$/)).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("SELECT");
  expect(document.body).not.toHaveTextContent("sessions");
});
