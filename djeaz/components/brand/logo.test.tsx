import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Logo } from "@/components/brand/logo";

function logoImages() {
  return Array.from(document.querySelectorAll("img"));
}

test("affiche l'indigo au clair et l'abricot au sombre, sous un seul nom", () => {
  render(<Logo />);

  expect(screen.getAllByRole("img", { name: "DJEAZ" })).toHaveLength(1);

  const [forLightBackground, forDarkBackground] = logoImages();
  expect(forLightBackground).toHaveAttribute("src", "/logo-dark.svg");
  expect(forLightBackground).toHaveAttribute("alt", "");
  expect(forLightBackground.className).toContain("dark:hidden");
  expect(forDarkBackground).toHaveAttribute("src", "/logo-light.svg");
  expect(forDarkBackground).toHaveAttribute("alt", "");
  expect(forDarkBackground.className).toContain("dark:block");
});

test("un logo décoratif n'est pas annoncé", () => {
  render(<Logo alt="" />);

  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(logoImages()).toHaveLength(2);
  expect(logoImages().every((image) => image.getAttribute("alt") === "")).toBe(true);
});

test("conserve le ratio officiel et accepte une largeur", () => {
  render(<Logo className="w-32" />);

  const wrapper = screen.getByRole("img", { name: "DJEAZ" });
  expect(wrapper.className).toContain("w-32");

  for (const image of logoImages()) {
    expect(image).toHaveAttribute("width", "300");
    expect(image).toHaveAttribute("height", "100");
  }
});
