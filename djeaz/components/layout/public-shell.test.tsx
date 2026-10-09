import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import { PublicShell } from "@/components/layout/public-shell";

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

test("la coque publique expose le logo, les accès compte et le thème", () => {
  render(
    <PublicShell>
      <p>Accueil</p>
    </PublicShell>,
  );

  const home = screen.getByRole("link", { name: "DJEAZ, accueil" });
  expect(home).toHaveAttribute("href", "/");
  expect(home.querySelector("img")).toHaveAttribute("src", "/logo-dark.svg");
  expect(screen.getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/sign-in");
  expect(screen.getByRole("link", { name: "Inscription" })).toHaveAttribute("href", "/sign-up");
  expect(screen.getByRole("group", { name: "Thème" })).toBeInTheDocument();
  expect(screen.getByText("Accueil")).toBeInTheDocument();

  const footer = screen.getByRole("contentinfo");
  expect(footer).toHaveTextContent("DJEAZ recueille les préférences musicales");
  expect(within(footer).queryByRole("link")).not.toBeInTheDocument();
});
