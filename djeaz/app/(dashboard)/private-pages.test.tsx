import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/components/brand/animated-mascot", () => ({
  AnimatedMascot: () => null,
}));

const getSession = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@/features/auth/server", () => ({
  auth: {
    getSession,
  },
}));

import Home from "@/app/(public)/page";
import CatalogPage from "@/app/(dashboard)/catalog/page";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import SettingsPage from "@/app/(dashboard)/settings/page";

const session = {
  session: {
    id: "session-1",
    userId: "user-from-session",
    expiresAt: new Date("2026-10-18T00:00:00.000Z"),
    token: "token",
    createdAt: new Date("2026-10-11T00:00:00.000Z"),
    updatedAt: new Date("2026-10-11T00:00:00.000Z"),
  },
  user: {
    id: "user-from-session",
    email: "dj@example.com",
    name: "DJ Test",
    emailVerified: false,
    createdAt: new Date("2026-10-11T00:00:00.000Z"),
    updatedAt: new Date("2026-10-11T00:00:00.000Z"),
  },
};

beforeEach(() => {
  getSession.mockReset();
});

test("la vitrine ne consulte pas la session", () => {
  expect(Home()).toBeTruthy();
  expect(getSession).not.toHaveBeenCalled();
});

test.each([
  ["/dashboard", DashboardPage],
  ["/catalog", CatalogPage],
  ["/settings", SettingsPage],
] as const)("%s sans session redirige avec son propre retour", async (path, Page) => {
  getSession.mockResolvedValue(null);

  await expect(Page()).rejects.toThrow(`REDIRECT:/sign-in?returnTo=${encodeURIComponent(path)}`);
});

test.each([
  ["Dashboard", DashboardPage],
  ["Catalogue", CatalogPage],
  ["Paramètres", SettingsPage],
] as const)("une session valide affiche %s", async (heading, Page) => {
  getSession.mockResolvedValue(session);

  render(await Page());

  expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  expect(getSession).toHaveBeenCalledOnce();
});
