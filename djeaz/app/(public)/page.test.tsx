import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import Home from "@/app/(public)/page";

vi.mock("@/components/brand/animated-mascot", () => ({
  AnimatedMascot: ({ variant, className }: { variant?: string; className?: string }) => (
    <span data-mascot={variant} className={className} />
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

test("la vitrine explique le produit et mène vers l'espace DJ", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Votre set commence bien avant le premier morceau.",
    }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByText(/préparez votre soirée/i)).toBeInTheDocument();

  expect(screen.getByRole("link", { name: "Créer mon espace DJ" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
  expect(screen.getByRole("link", { name: "Je me lance !" })).toHaveAttribute("href", "/sign-up");
  expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/sign-in");
  expect(screen.getByRole("link", { name: "J'ai déjà un compte" })).toHaveAttribute(
    "href",
    "/sign-in",
  );

  expect(screen.getByRole("heading", { name: "Comment ça marche ?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Créez votre événement" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Partagez le sondage" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Découvrez les tendances" })).toBeInTheDocument();

  expect(
    screen.getByRole("heading", {
      name: "Un sondage auquel les invités ont vraiment envie de répondre.",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Aucune inscription et aucune application à installer."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Ils peuvent ajouter une ou plusieurs envies libres."),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Vous gardez toute la liberté de construire votre set/),
  ).toBeInTheDocument();
  expect(document.querySelector("[data-mascot='floaty']")).toBeInTheDocument();
});
