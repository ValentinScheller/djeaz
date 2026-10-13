import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/features/auth/actions", () => ({
  signOutAction: vi.fn(),
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

const user = {
  artistName: "DJ Nova",
  email: "nova@example.com",
};

function renderDashboard(identity = user) {
  return render(
    <TooltipProvider>
      <DashboardShell user={identity}>
        <p>Contenu</p>
      </DashboardShell>
    </TooltipProvider>,
  );
}

beforeEach(() => {
  navigation.pathname = "/dashboard";
});

test("la navigation indique la page active et l'identité de session", () => {
  navigation.pathname = "/catalog";
  renderDashboard();

  expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Paramètres" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute("href", "/catalog");
  expect(document.querySelector('img[src="/mascotte.svg"]')).toHaveAttribute("alt", "");

  const account = screen.getByRole("button", { name: `${user.artistName}, ${user.email}` });
  expect(screen.queryByText("DJ Démo")).not.toBeInTheDocument();

  fireEvent.click(account);
  expect(screen.getByRole("menuitem", { name: "Déconnexion" })).toBeEnabled();
});

test("un nom d'artiste et un e-mail longs restent accessibles", () => {
  const identity = {
    artistName: "A".repeat(80),
    email: `${"boite-tres-longue".repeat(4)}@example.com`,
  };
  renderDashboard(identity);

  const account = screen.getByRole("button", {
    name: `${identity.artistName}, ${identity.email}`,
  });
  expect(screen.getAllByTitle(identity.artistName).length).toBeGreaterThan(0);
  expect(screen.getAllByTitle(identity.email).length).toBeGreaterThan(0);

  fireEvent.click(account);
  expect(screen.getByRole("menuitem", { name: "Déconnexion" })).toBeEnabled();
});

test("le tiroir mobile s'ouvre, expose la navigation et se ferme", () => {
  renderDashboard();

  const menu = screen.getByRole("button", { name: "Menu" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  menu.focus();
  fireEvent.click(menu);
  const dialog = screen.getByRole("dialog", { name: "Navigation" });
  expect(within(dialog).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(dialog).getByRole("link", { name: "Catalogue" })).not.toHaveAttribute(
    "aria-current",
  );
  expect(within(dialog).getByRole("link", { name: "Paramètres" })).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: `${user.artistName}, ${user.email}` }),
  ).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(menu).toHaveFocus();

  menu.focus();
  fireEvent.click(menu);
  expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(menu).toHaveFocus();
});
