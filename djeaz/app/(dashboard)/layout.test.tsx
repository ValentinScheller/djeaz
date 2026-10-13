import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("server-only", () => ({}));

const getSession = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
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

vi.mock("@/features/auth/server", () => ({
  auth: {
    getSession,
  },
}));

vi.mock("@/features/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/features/catalog/ensure-catalog.server", () => ({
  ensureCatalogForUser: vi.fn(async () => ({ id: "catalog-1" })),
}));

import DashboardLayout from "@/app/(dashboard)/layout";

const createdAt = new Date("2026-10-11T00:00:00.000Z");

function sessionFor(user: { id: string; name: string; artistName: string; email: string }) {
  return {
    session: {
      id: `session-${user.id}`,
      userId: user.id,
      expiresAt: new Date("2026-10-18T00:00:00.000Z"),
      token: "token",
      createdAt,
      updatedAt: createdAt,
    },
    user: {
      id: user.id,
      name: user.name,
      artistName: user.artistName,
      email: user.email,
      emailVerified: false,
      createdAt,
      updatedAt: createdAt,
    },
  };
}

const userA = {
  id: "user-a",
  name: "Camille Martin",
  artistName: "DJ Nova",
  email: "nova@example.com",
};

const userB = {
  id: "user-b",
  name: "Alex Bernard",
  artistName: "DJ Rivage",
  email: "rivage@example.com",
};

async function renderLayout() {
  return render(
    <TooltipProvider>{await DashboardLayout({ children: <p>Contenu privé</p> })}</TooltipProvider>,
  );
}

beforeEach(() => {
  getSession.mockReset();
});

test("la sidebar affiche le nom d'artiste et l'e-mail, pas le nom privé", async () => {
  getSession.mockResolvedValue(sessionFor(userA));

  await renderLayout();

  expect(
    screen.getByRole("button", { name: `${userA.artistName}, ${userA.email}` }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(userA.artistName).length).toBeGreaterThan(0);
  expect(screen.getAllByText(userA.email).length).toBeGreaterThan(0);
  expect(screen.queryByText(userA.name)).not.toBeInTheDocument();
  expect(screen.getByText("Contenu privé")).toBeInTheDocument();
});

test("deux sessions affichent chacune leur propre identité", async () => {
  getSession.mockResolvedValue(sessionFor(userA));
  const first = await renderLayout();

  expect(
    screen.getByRole("button", { name: `${userA.artistName}, ${userA.email}` }),
  ).toBeInTheDocument();
  expect(screen.queryByText(userB.artistName)).not.toBeInTheDocument();
  expect(screen.queryByText(userB.email)).not.toBeInTheDocument();
  first.unmount();

  getSession.mockResolvedValue(sessionFor(userB));
  await renderLayout();

  expect(
    screen.getByRole("button", { name: `${userB.artistName}, ${userB.email}` }),
  ).toBeInTheDocument();
  expect(screen.queryByText(userA.artistName)).not.toBeInTheDocument();
  expect(screen.queryByText(userA.email)).not.toBeInTheDocument();
  expect(screen.queryByText(userA.name)).not.toBeInTheDocument();
  expect(screen.queryByText(userB.name)).not.toBeInTheDocument();
});

test("sans session, la coque n'invente aucune identité", async () => {
  getSession.mockResolvedValue(null);

  await renderLayout();

  expect(screen.getByText("Contenu privé")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /DJ/ })).not.toBeInTheDocument();
  expect(screen.queryByText(userA.email)).not.toBeInTheDocument();
});
