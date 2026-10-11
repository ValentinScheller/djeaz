import { eq, sql } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db/client.server";
import { account, rateLimit, rateLimits, session, user, verification } from "@/db/schema";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/password-policy";
import { auth } from "@/features/auth/server";

const origin = "http://127.0.0.1:3100";
const validPassword = "a".repeat(PASSWORD_MIN_LENGTH);

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function sessionCookie(response: Response): string | undefined {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("better-auth.session_token="));
}

function cookiePair(setCookie: string): string {
  return setCookie.split(";", 1)[0] ?? "";
}

function cookieAttributes(setCookie: string): string[] {
  return setCookie
    .split(";")
    .slice(1)
    .map((part) => part.trim().toLowerCase());
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

async function authRequest(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: unknown;
    cookie?: string;
    ip?: string;
    requestOrigin?: string;
  },
): Promise<Response> {
  const headers = new Headers({
    origin: init.requestOrigin ?? origin,
    "x-forwarded-for": init.ip ?? "203.0.113.10",
  });
  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (init.cookie) {
    headers.set("cookie", init.cookie);
  }

  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  );
}

test("inscrit, connecte et déconnecte sans vérification d'e-mail", async () => {
  const email = "dj@example.com";
  const signUp = await authRequest("/sign-up/email", {
    method: "POST",
    body: { name: "DJ Test", email, password: validPassword },
  });
  const signUpBody = (await readBody(signUp)) as {
    user?: { email?: string; emailVerified?: boolean };
  };
  const setCookie = sessionCookie(signUp);

  expect(signUp.status).toBe(200);
  expect(signUpBody.user?.email).toBe(email);
  expect(signUpBody.user?.emailVerified).toBe(false);
  expect(setCookie).toBeDefined();

  const attributes = cookieAttributes(setCookie!);
  expect(setCookie!.startsWith("better-auth.session_token=")).toBe(true);
  expect(setCookie!.startsWith("__Secure-")).toBe(false);
  expect(attributes).toContain("httponly");
  expect(attributes).toContain("samesite=lax");
  expect(attributes).not.toContain("secure");
  expect(attributes).toContain("max-age=604800");

  const [createdUser] = await db.select().from(user);
  const accounts = await db.select().from(account);
  const sessions = await db.select().from(session);
  const verifications = await db.select().from(verification);

  expect(createdUser?.email).toBe(email);
  expect(createdUser?.emailVerified).toBe(false);
  expect(accounts).toHaveLength(1);
  expect(accounts[0]?.providerId).toBe("credential");
  expect(accounts[0]?.userId).toBe(createdUser?.id);
  expect(accounts[0]?.password).toEqual(expect.any(String));
  expect(accounts[0]?.password).not.toBe(validPassword);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.userId).toBe(createdUser?.id);
  expect(verifications).toHaveLength(0);

  const cookie = cookiePair(setCookie!);
  const current = await authRequest("/get-session", { method: "GET", cookie });
  const currentBody = (await readBody(current)) as { user?: { email?: string } } | null;

  expect(current.status).toBe(200);
  expect(currentBody?.user?.email).toBe(email);

  const duplicate = await authRequest("/sign-up/email", {
    method: "POST",
    body: { name: "Autre", email, password: validPassword },
  });
  const duplicateBody = (await readBody(duplicate)) as { code?: string };

  expect(duplicate.status).toBe(422);
  expect(duplicateBody.code).toBe("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");
  expect(await db.select().from(user)).toHaveLength(1);

  const signOut = await authRequest("/sign-out", { method: "POST", cookie, body: {} });
  expect(signOut.status).toBe(200);
  expect(await db.select().from(session)).toHaveLength(0);

  const afterSignOut = await authRequest("/get-session", { method: "GET", cookie });
  expect(await readBody(afterSignOut)).toBeNull();

  const wrongPassword = await authRequest("/sign-in/email", {
    method: "POST",
    body: { email, password: `${validPassword}x` },
  });
  const wrongBody = (await readBody(wrongPassword)) as { code?: string; message?: string };

  expect(wrongPassword.status).toBe(401);
  expect(wrongBody.code).toBe("INVALID_EMAIL_OR_PASSWORD");
  expect(wrongBody.message).not.toContain(validPassword);
  expect(await db.select().from(session)).toHaveLength(0);

  const signIn = await authRequest("/sign-in/email", {
    method: "POST",
    body: { email, password: validPassword },
  });
  const signInCookie = sessionCookie(signIn);
  const restored = await authRequest("/get-session", {
    method: "GET",
    cookie: signInCookie ? cookiePair(signInCookie) : "",
  });
  const restoredBody = (await readBody(restored)) as { user?: { emailVerified?: boolean } } | null;

  expect(signIn.status).toBe(200);
  expect(signInCookie).toBeDefined();
  expect(restoredBody?.user?.emailVerified).toBe(false);
  expect(await db.select().from(session)).toHaveLength(1);
});

test("refuse un mot de passe hors des bornes 8–128", async () => {
  const short = await authRequest("/sign-up/email", {
    method: "POST",
    ip: "203.0.113.11",
    body: { name: "DJ", email: "court@example.com", password: "a".repeat(PASSWORD_MIN_LENGTH - 1) },
  });
  const shortBody = (await readBody(short)) as { code?: string };

  expect(short.status).toBe(400);
  expect(shortBody.code).toBe("PASSWORD_TOO_SHORT");
  expect(await db.select().from(user)).toHaveLength(0);

  const longPassword = "b".repeat(PASSWORD_MAX_LENGTH + 1);
  const long = await authRequest("/sign-up/email", {
    method: "POST",
    ip: "203.0.113.11",
    body: { name: "DJ", email: "long@example.com", password: longPassword },
  });
  const longBody = (await readBody(long)) as { code?: string; message?: string };

  expect(long.status).toBe(400);
  expect(longBody.code).toBe("PASSWORD_TOO_LONG");
  expect(longBody.message).not.toContain(longPassword);
  expect(await db.select().from(user)).toHaveLength(0);
});

test("refuse une origine non configurée", async () => {
  const response = await authRequest("/sign-up/email", {
    method: "POST",
    ip: "203.0.113.12",
    requestOrigin: "https://evil.example",
    body: { name: "DJ", email: "origine@example.com", password: validPassword },
  });
  const body = (await readBody(response)) as { code?: string };

  expect(response.status).toBe(403);
  expect(body.code).toBe("INVALID_ORIGIN");
  expect(await db.select().from(user)).toHaveLength(0);
});

test("persiste le rate limit Better Auth dans PostgreSQL et répond 429", async () => {
  const ip = "203.0.113.50";
  const body = { email: "absent@example.com", password: validPassword };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await authRequest("/sign-in/email", { method: "POST", ip, body });
    expect(response.status).toBe(401);
    await response.text();
  }

  const blocked = await authRequest("/sign-in/email", { method: "POST", ip, body });
  const blockedBody = (await readBody(blocked)) as { message?: string };
  const retryAfter = Number(blocked.headers.get("x-retry-after"));

  expect(blocked.status).toBe(429);
  expect(blockedBody.message).toBe("Too many requests. Please try again later.");
  expect(retryAfter).toBeGreaterThan(0);

  const database = await db.execute<{ current_database: string }>(
    sql`SELECT current_database() AS current_database`,
  );
  const rows = await db.select().from(rateLimit);
  const projectRows = await db.select().from(rateLimits);

  expect(database.rows[0]?.current_database).toBe("djeaz_test");
  expect(projectRows).toHaveLength(0);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.key).toContain(ip);
  expect(rows[0]?.count).toBe(3);

  await db
    .update(rateLimit)
    .set({ lastRequest: Date.now() - 11_000 })
    .where(eq(rateLimit.id, rows[0]!.id));

  const afterWindow = await authRequest("/sign-in/email", { method: "POST", ip, body });
  expect(afterWindow.status).toBe(401);
  await afterWindow.text();

  const [resetRow] = await db.select().from(rateLimit);
  expect(resetRow?.count).toBe(1);
});
