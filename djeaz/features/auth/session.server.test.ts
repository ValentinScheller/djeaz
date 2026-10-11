import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const headerStore = vi.hoisted(() => ({
  current: new Headers(),
}));

const getSession = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => headerStore.current,
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

import { getAuthenticatedSession, requirePageSession, signInRedirectPath } from "./session.server";

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

function expectInternalSignIn(href: string): string {
  const url = new URL(href, "http://djeaz.local");
  expect(url.origin).toBe("http://djeaz.local");
  expect(url.pathname).toBe("/sign-in");

  const returnTo = url.searchParams.get("returnTo");
  expect(returnTo?.startsWith("/")).toBe(true);
  expect(returnTo?.startsWith("//")).toBe(false);

  const destination = new URL(returnTo ?? "", "http://djeaz.local");
  expect(destination.origin).toBe("http://djeaz.local");
  return returnTo ?? "";
}

beforeEach(() => {
  headerStore.current = new Headers();
  getSession.mockReset();
});

test("une session absente répond UNAUTHENTICATED", async () => {
  getSession.mockResolvedValue(null);

  await expect(getAuthenticatedSession()).resolves.toEqual({
    ok: false,
    error: { code: "UNAUTHENTICATED", message: "Connexion requise." },
  });
});

test("une session valide expose l'utilisateur issu de Better Auth", async () => {
  headerStore.current = new Headers({ "x-user-id": "browser-user" });
  getSession.mockResolvedValue(session);

  const result = await getAuthenticatedSession();

  expect(result).toEqual({ ok: true, data: session });
  if (result.ok) {
    expect(result.data.user.id).toBe("user-from-session");
    expect(result.data.session.userId).toBe("user-from-session");
  }
});

test("un cookie présent ne suffit pas si la session est refusée", async () => {
  headerStore.current = new Headers({
    cookie: "better-auth.session_token=forged",
    "x-user-id": "browser-user",
  });
  getSession.mockResolvedValue(null);

  await expect(getAuthenticatedSession()).resolves.toMatchObject({
    ok: false,
    error: { code: "UNAUTHENTICATED" },
  });

  expect(getSession).toHaveBeenCalledOnce();
  const forwarded = getSession.mock.calls[0]?.[0] as Headers;
  expect(forwarded.get("cookie")).toBe("better-auth.session_token=forged");
});

test("une page privée redirige vers une connexion interne", async () => {
  getSession.mockResolvedValue(null);

  await expect(requirePageSession("/dashboard")).rejects.toThrow(
    "REDIRECT:/sign-in?returnTo=%2Fdashboard",
  );
});

test("une session valide laisse passer la page", async () => {
  getSession.mockResolvedValue(session);

  await expect(requirePageSession("/settings")).resolves.toBe(session);
});

test("le retour encode les chemins internes", () => {
  expect(signInRedirectPath("/dashboard")).toBe("/sign-in?returnTo=%2Fdashboard");
  expect(signInRedirectPath("/catalog")).toBe("/sign-in?returnTo=%2Fcatalog");
  expect(signInRedirectPath("/settings")).toBe("/sign-in?returnTo=%2Fsettings");
  expect(expectInternalSignIn(signInRedirectPath("/catalog?x=1"))).toBe("/catalog?x=1");
});

test("une destination externe ne devient pas une redirection externe", () => {
  const external = [
    "https://evil.example",
    "http://evil.example/dashboard",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "https://djeaz.local/dashboard",
  ];

  for (const value of external) {
    const href = signInRedirectPath(value);
    expect(expectInternalSignIn(href)).toBe("/dashboard");
    expect(new URL(href, "http://djeaz.local").host).toBe("djeaz.local");
  }
});
