import { eq } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const headerStore = vi.hoisted(() => ({
  current: new Headers(),
}));

vi.mock("next/headers", () => ({
  headers: async () => headerStore.current,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { GET } from "@/app/api/auth/[...all]/route";
import { db } from "@/db/client.server";
import { session as sessionTable, user } from "@/db/schema";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/password-policy";
import { auth } from "@/features/auth/server";
import { getAuthenticatedSession, requirePageSession } from "@/features/auth/session.server";

const origin = "http://127.0.0.1:3100";
const validPassword = "a".repeat(PASSWORD_MIN_LENGTH);

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function cookiePair(setCookie: string): string {
  return setCookie.split(";", 1)[0] ?? "";
}

async function signUp(email: string): Promise<string> {
  const response = await auth.handler(
    new Request(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.80",
      },
      body: JSON.stringify({
        name: "Camille Martin",
        artistName: "DJ Nova",
        email,
        password: validPassword,
      }),
    }),
  );
  const setCookie = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("better-auth.session_token="));

  expect(response.status).toBe(200);
  expect(setCookie).toBeDefined();
  return cookiePair(setCookie!);
}

test("sans cookie, la session métier est UNAUTHENTICATED", async () => {
  headerStore.current = new Headers({ "x-user-id": "browser-user" });

  await expect(getAuthenticatedSession()).resolves.toEqual({
    ok: false,
    error: { code: "UNAUTHENTICATED", message: "Connexion requise." },
  });
});

test("une session Better Auth valide fournit l'utilisateur en base", async () => {
  const email = "session-valide@example.com";
  const cookie = await signUp(email);
  const [created] = await db.select().from(user).where(eq(user.email, email));
  headerStore.current = new Headers({
    cookie,
    origin,
    "x-user-id": "browser-user",
  });

  const result = await getAuthenticatedSession();

  expect(created?.id).toEqual(expect.any(String));
  expect(result).toMatchObject({
    ok: true,
    data: {
      user: { id: created?.id, email, name: "Camille Martin", artistName: "DJ Nova" },
      session: { userId: created?.id },
    },
  });
  if (result.ok) {
    const artistName: string = result.data.user.artistName;
    expect(artistName).toBe("DJ Nova");
  }
});

test("un cookie forgé ou une session révoquée ne sont pas authentifiés", async () => {
  headerStore.current = new Headers({
    cookie: "better-auth.session_token=forged-token",
    "x-user-id": "browser-user",
  });

  await expect(getAuthenticatedSession()).resolves.toMatchObject({
    ok: false,
    error: { code: "UNAUTHENTICATED" },
  });

  const email = "session-revoquee@example.com";
  const cookie = await signUp(email);
  await db.delete(sessionTable);
  headerStore.current = new Headers({ cookie, origin });

  await expect(getAuthenticatedSession()).resolves.toMatchObject({
    ok: false,
    error: { code: "UNAUTHENTICATED" },
  });
  await expect(requirePageSession("/catalog")).rejects.toThrow(
    "REDIRECT:/sign-in?returnTo=%2Fcatalog",
  );
});

test("une session valide ne redirige pas la page", async () => {
  const cookie = await signUp("page-autorisee@example.com");
  headerStore.current = new Headers({ cookie, origin });

  const session = await requirePageSession("/settings");

  expect(session.user.email).toBe("page-autorisee@example.com");
  expect(session.user.id).toBe(session.session.userId);
});

test("GET /api/auth/get-session reste public", async () => {
  const response = await GET(
    new Request(`${origin}/api/auth/get-session`, {
      headers: { origin },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(await response.json()).toBeNull();
});
