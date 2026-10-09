import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Mascot } from "@/components/brand/mascot";

test("la mascotte statique est décorative par défaut", () => {
  render(<Mascot />);

  const image = document.querySelector("img");
  expect(image).toHaveAttribute("src", "/mascotte.svg");
  expect(image).toHaveAttribute("alt", "");
  expect(image).toHaveAttribute("width", "600");
  expect(image).toHaveAttribute("height", "600");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("un alt informatif est annoncé une seule fois", () => {
  render(<Mascot alt="Aucune réponse pour le moment" />);

  expect(screen.getAllByRole("img", { name: "Aucune réponse pour le moment" })).toHaveLength(1);
});
