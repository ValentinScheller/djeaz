import { cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

vi.mock("@/features/auth/actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
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

import SignInPage from "@/app/(public)/sign-in/page";
import SignUpPage from "@/app/(public)/sign-up/page";

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

test("un utilisateur connecté qui ouvre la connexion est renvoyé au dashboard", async () => {
  getSession.mockResolvedValue(session);

  await expect(
    SignInPage({ searchParams: Promise.resolve({ returnTo: "/catalog" }) }),
  ).rejects.toThrow("REDIRECT:/dashboard");
});

test("un utilisateur connecté qui ouvre l'inscription est renvoyé au dashboard", async () => {
  getSession.mockResolvedValue(session);

  await expect(SignUpPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
    "REDIRECT:/dashboard",
  );
});

test("la connexion conserve un retour interne et ignore une adresse externe", async () => {
  getSession.mockResolvedValue(null);

  render(await SignInPage({ searchParams: Promise.resolve({ returnTo: "/catalog" }) }));

  expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Inscription" })).toHaveAttribute(
    "href",
    "/sign-up?returnTo=%2Fcatalog",
  );
  expect(screen.getByLabelText("Adresse e-mail")).toBeInTheDocument();

  cleanup();
  render(await SignInPage({ searchParams: Promise.resolve({ returnTo: "https://evil.example" }) }));

  expect(screen.getAllByRole("link", { name: "Inscription" }).at(-1)).toHaveAttribute(
    "href",
    "/sign-up",
  );
});
