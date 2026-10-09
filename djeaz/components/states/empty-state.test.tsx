import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { EmptyState } from "@/components/states/empty-state";

test("l'état vide affiche le titre, la description, l'action et la mascotte", () => {
  render(
    <EmptyState
      title="Rien à afficher"
      description="Revenez plus tard, cet espace est encore vide."
      action={<button type="button">Continuer</button>}
    />,
  );

  expect(screen.getByRole("heading", { name: "Rien à afficher" })).toBeInTheDocument();
  expect(screen.getByText("Revenez plus tard, cet espace est encore vide.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continuer" })).toBeInTheDocument();
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
  expect(document.querySelector("img")).toHaveAttribute("alt", "");
});

test("la description et l'action sont optionnelles", () => {
  render(<EmptyState title="Toujours vide" />);

  expect(screen.getByRole("heading", { name: "Toujours vide" })).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
});
