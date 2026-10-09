import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-test" }),
}));

import GlobalError from "@/app/global-error";

test("l'erreur globale reprend le message français et reset", () => {
  const reset = vi.fn();
  const error = new Error("stack trace interne") as Error & { digest?: string };
  error.digest = "99887766";

  render(<GlobalError error={error} reset={reset} />);

  expect(screen.getByRole("heading", { name: "Une erreur est survenue." })).toBeInTheDocument();
  expect(screen.getByText("99887766")).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("stack trace");

  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(reset).toHaveBeenCalledOnce();
});
