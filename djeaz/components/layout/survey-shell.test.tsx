import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SurveyShell } from "@/components/layout/survey-shell";

const eventName = "Mariage de Camille et Noé — soirée sur la péniche du canal";

test("la coque sondage expose l'événement, le contenu et les actions", () => {
  render(
    <SurveyShell
      eventName={eventName}
      cart={<button type="button">Panier</button>}
      validate={<button type="button">Valider</button>}
    >
      <p>Morceaux proposés</p>
    </SurveyShell>,
  );

  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "DJEAZ" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: eventName })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Passer en mode sombre" })).toBeInTheDocument();

  const main = screen.getByRole("main");
  expect(main).toHaveTextContent("Morceaux proposés");

  const actions = screen.getByRole("region", { name: "Panier et validation" });
  expect(actions).toContainElement(screen.getByRole("button", { name: "Panier" }));
  expect(actions).toContainElement(screen.getByRole("button", { name: "Valider" }));
  expect(main).not.toContainElement(screen.getByRole("button", { name: "Valider" }));
});
