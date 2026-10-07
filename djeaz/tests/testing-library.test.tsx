import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("React Testing Library et les matchers DOM fonctionnent", () => {
  render(<p>Harnais prêt</p>);

  expect(screen.getByText("Harnais prêt")).toBeInTheDocument();
});

test("server-only bloque l'import hors composant serveur", async () => {
  await expect(import("server-only")).rejects.toThrow(/Client Component/);
});
