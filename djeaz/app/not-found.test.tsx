import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import NotFound from "@/app/not-found";

vi.mock("@/components/brand/animated-mascot", () => ({
  AnimatedMascot: ({
    variant,
    alt = "",
    className,
  }: {
    variant?: string;
    alt?: string;
    className?: string;
  }) => (
    <span
      data-mascot={variant}
      className={className}
      {...(alt ? { role: "img" as const, "aria-label": alt } : {})}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

test("la page 404 explique l'absence, montre la mascotte et ramène à l'accueil", () => {
  render(<NotFound />);

  expect(screen.getByText("404")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Cette page est introuvable." })).toBeInTheDocument();
  expect(screen.getByText(/l'adresse contient une erreur/)).toBeInTheDocument();

  const mascot = document.querySelector("[data-mascot]");
  expect(mascot).toHaveAttribute("data-mascot", "explode");
  expect(mascot).toHaveClass("w-52", "sm:w-64");
  expect(mascot).not.toHaveAttribute("role");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();

  expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");
});
