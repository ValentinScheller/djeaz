import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const headerStore = vi.hoisted(() => ({
  current: new Headers(),
}));

const cookieSets = vi.hoisted(() => ({
  current: [] as Array<{ name: string; value: string }>,
}));

vi.mock("next/headers", () => ({
  headers: async () => headerStore.current,
  cookies: async () => ({
    set(name: string, value: string) {
      cookieSets.current.push({ name, value });
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
  RedirectType: { replace: "replace", push: "push" },
}));

import { db } from "@/db/client.server";
import { session as sessionTable, user } from "@/db/schema";
import { signInAction, signOutAction, signUpAction } from "@/features/auth/actions";
import { initialCredentialsState } from "@/features/auth/form-state";
import { getAuthenticatedSession, requirePageSession } from "@/features/auth/session.server";

const origin = "http://127.0.0.1:3100";
const password = "motdepasse";

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value);
  }
  return data;
}

function setRequestHeaders(ip: string, cookie?: string) {
  const headers = new Headers({
    origin,
    "x-forwarded-for": ip,
  });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  headerStore.current = headers;
}

test("l'inscription crée la session et prépare le dashboard", async () => {
  setRequestHeaders("203.0.113.90");
  const email = "inscription@example.com";

  const created = await signUpAction(
    initialCredentialsState,
    formData({ name: "DJ Test", email, password, confirmPassword: password }),
  );

  expect(created.redirectTo).toBe("/dashboard");
  expect(created.formError).toBeUndefined();
  expect(JSON.stringify(created)).not.toContain(password);

  const users = await db.select().from(user);
  const sessions = await db.select().from(sessionTable);

  expect(users).toHaveLength(1);
  expect(users[0]?.email).toBe(email);
  expect(users[0]?.name).toBe("DJ Test");
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.userId).toBe(users[0]?.id);
  expect(cookieSets.current.some((cookie) => cookie.name.includes("session_token"))).toBe(true);
});

test("un e-mail déjà utilisé reste en français et conserve les saisies non sensibles", async () => {
  setRequestHeaders("203.0.113.91");
  const email = "deja-pris@example.com";
  const fields = { name: "DJ Test", email, password, confirmPassword: password };

  const created = await signUpAction(initialCredentialsState, formData(fields));
  expect(created.redirectTo).toBe("/dashboard");

  const duplicate = await signUpAction(
    initialCredentialsState,
    formData({ ...fields, name: "Autre DJ" }),
  );

  expect(duplicate.fieldErrors.email).toBe("Un compte existe déjà avec cette adresse e-mail.");
  expect(duplicate.formError).toBeUndefined();
  expect(duplicate.values).toEqual({ name: "Autre DJ", email });
  expect(JSON.stringify(duplicate)).not.toContain(password);
  expect(await db.select().from(user)).toHaveLength(1);
});

test("la connexion indique le dashboard ou un retour interne", async () => {
  setRequestHeaders("203.0.113.92");
  const email = "connexion@example.com";

  const created = await signUpAction(
    initialCredentialsState,
    formData({ name: "DJ Test", email, password, confirmPassword: password }),
  );
  expect(created.redirectTo).toBe("/dashboard");

  const home = await signInAction(initialCredentialsState, formData({ email, password }));
  expect(home.redirectTo).toBe("/dashboard");

  setRequestHeaders("203.0.113.93");
  const catalog = await signInAction(
    initialCredentialsState,
    formData({ email, password, returnTo: "/catalog" }),
  );
  expect(catalog.redirectTo).toBe("/catalog");

  for (const [ip, returnTo] of [
    ["203.0.113.94", "https://evil.example"],
    ["203.0.113.95", "//evil.example"],
    ["203.0.113.96", "/\\evil.example"],
  ] as const) {
    setRequestHeaders(ip);
    const rejected = await signInAction(
      initialCredentialsState,
      formData({ email, password, returnTo }),
    );
    expect(rejected.redirectTo).toBe("/dashboard");
  }
});

test("de mauvais identifiants restent un message générique", async () => {
  setRequestHeaders("203.0.113.97");

  const result = await signInAction(
    initialCredentialsState,
    formData({ email: "absent@example.com", password }),
  );

  expect(result.formError).toBe("Adresse e-mail ou mot de passe incorrect.");
  expect(result.redirectTo).toBeUndefined();
  expect(result.formError).not.toMatch(/exist|introuvable|absent@example.com/i);
  expect(JSON.stringify(result)).not.toContain(password);
  expect(result.values.email).toBe("absent@example.com");
  expect(await db.select().from(sessionTable)).toHaveLength(0);
});

test("une limite de débit Better Auth est expliquée en français", async () => {
  const ip = "203.0.113.98";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    setRequestHeaders(ip);
    const result = await signInAction(
      initialCredentialsState,
      formData({ email: "absent@example.com", password }),
    );
    expect(result.formError).toBe("Adresse e-mail ou mot de passe incorrect.");
  }

  setRequestHeaders(ip);
  const blocked = await signInAction(
    initialCredentialsState,
    formData({ email: "absent@example.com", password }),
  );

  expect(blocked.formError).toBe("Trop de tentatives. Réessayez dans quelques instants.");
  expect(blocked.formError).not.toContain("Too many");
  expect(JSON.stringify(blocked)).not.toContain(password);
});

test("la déconnexion invalide la session et renvoie vers la connexion", async () => {
  setRequestHeaders("203.0.113.99");
  cookieSets.current = [];

  const created = await signUpAction(
    initialCredentialsState,
    formData({
      name: "DJ Test",
      email: "depart@example.com",
      password,
      confirmPassword: password,
    }),
  );
  expect(created.redirectTo).toBe("/dashboard");

  const sessionCookie = cookieSets.current.find((cookie) => cookie.name.includes("session_token"));
  expect(sessionCookie).toBeDefined();
  setRequestHeaders("203.0.113.99", `${sessionCookie!.name}=${sessionCookie!.value}`);

  await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");
  expect(await db.select().from(sessionTable)).toHaveLength(0);

  await expect(getAuthenticatedSession()).resolves.toMatchObject({
    ok: false,
    error: { code: "UNAUTHENTICATED" },
  });
  await expect(requirePageSession("/catalog")).rejects.toThrow(
    "REDIRECT:/sign-in?returnTo=%2Fcatalog",
  );
});
