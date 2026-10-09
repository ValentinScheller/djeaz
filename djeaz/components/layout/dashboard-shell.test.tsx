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

function renderDashboard() {
  return render(
    <TooltipProvider>
      <DashboardShell>
        <p>Contenu</p>
      </DashboardShell>
    </TooltipProvider>,
  );
}

beforeEach(() => {
  navigation.pathname = "/dashboard";
});

test("la navigation indique la page active et l'identité factice", () => {
  navigation.pathname = "/catalog";
  renderDashboard();

  expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Paramètres" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute("href", "/catalog");
  expect(document.querySelector('img[src="/mascotte.svg"]')).toHaveAttribute("alt", "");
  expect(screen.getByRole("button", { name: /DJ Démo/ })).toBeInTheDocument();
  expect(screen.getByText("dj@example.test")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /DJ Démo/ }));
  expect(screen.getByRole("menuitem", { name: "Déconnexion" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
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
  expect(within(dialog).getByRole("button", { name: /DJ Démo/ })).toBeInTheDocument();

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
