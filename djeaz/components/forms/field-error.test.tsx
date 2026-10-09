import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { FieldError } from "@/components/forms/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

test("l'erreur de champ est liée au contrôle et reste du texte", () => {
  render(
    <>
      <Label htmlFor="nom">Nom</Label>
      <Input id="nom" aria-invalid="true" aria-describedby="nom-erreur" />
      <FieldError id="nom-erreur" message="Indiquez un nom. <script>alert(1)</script>" />
    </>,
  );

  const field = screen.getByRole("textbox", { name: "Nom" });
  const alert = screen.getByRole("alert");

  expect(field).toHaveAttribute("aria-invalid", "true");
  expect(field).toHaveAccessibleDescription("Erreur : Indiquez un nom. <script>alert(1)</script>");
  expect(alert).toHaveAttribute("id", "nom-erreur");
  expect(alert).toHaveTextContent("Indiquez un nom.");
  expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(document.querySelector("script")).toBeNull();
});
