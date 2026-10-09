import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { CardListSkeleton, PageSkeleton } from "@/components/states/loading-skeletons";

test("le squelette de page annonce seulement le chargement", () => {
  render(<PageSkeleton />);

  expect(screen.getByRole("status", { name: "Chargement…" })).toHaveAttribute("aria-busy", "true");
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
});

test("le squelette de cartes réserve une liste décorative", () => {
  const { container } = render(<CardListSkeleton />);

  expect(screen.getByRole("status", { name: "Chargement…" })).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  expect(container.querySelectorAll("li")).toHaveLength(3);
});

test("le nombre de cartes du squelette est paramétrable", () => {
  const { container } = render(<CardListSkeleton count={2} />);

  expect(container.querySelectorAll("li")).toHaveLength(2);
});
