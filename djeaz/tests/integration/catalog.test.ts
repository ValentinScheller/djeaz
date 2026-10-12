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

import { db } from "@/db/client.server";
import { catalogCategories, catalogs, catalogTracks, musicTracks, user } from "@/db/schema";
import { ensureCatalogForUser } from "@/features/catalog/ensure-catalog.server";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/password-policy";
import { auth } from "@/features/auth/server";
import { requirePageSession } from "@/features/auth/session.server";

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
        "x-forwarded-for": "203.0.113.40",
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

async function insertUser(id: string, email: string): Promise<void> {
  await db.insert(user).values({
    id,
    name: "DJ",
    artistName: "DJ",
    email,
  });
}

test("l'inscription crée exactement un catalogue vide", async () => {
  await signUp("catalogue-vide@example.com");

  const rows = await db.select().from(catalogs);
  const categories = await db.select().from(catalogCategories);
  const associations = await db.select().from(catalogTracks);
  const tracks = await db.select().from(musicTracks);
  const [owner] = await db.select().from(user);

  expect(rows).toHaveLength(1);
  expect(rows[0]?.ownerId).toBe(owner?.id);
  expect(rows[0]?.revision).toBe(0);
  expect(categories).toHaveLength(0);
  expect(associations).toHaveLength(0);
  expect(tracks).toHaveLength(0);

  const again = await ensureCatalogForUser(owner!.id);
  const afterRepeat = await db.select().from(catalogs);
  expect(again.id).toBe(rows[0]?.id);
  expect(again.revision).toBe(0);
  expect(afterRepeat).toHaveLength(1);
});

test("des appels concurrents ne créent qu'un catalogue", async () => {
  await insertUser("user-concurrent", "concurrent@example.com");

  const results = await Promise.all(
    Array.from({ length: 8 }, () => ensureCatalogForUser("user-concurrent")),
  );

  const rows = await db.select().from(catalogs);
  expect(rows).toHaveLength(1);
  expect(new Set(results.map((row) => row.id)).size).toBe(1);
  expect(rows[0]?.revision).toBe(0);
  expect(await db.select().from(catalogCategories)).toHaveLength(0);
  expect(await db.select().from(catalogTracks)).toHaveLength(0);
});

test("un compte sans catalogue le reçoit au premier accès privé, sans réinitialiser ensuite", async () => {
  const cookie = await signUp("reprise@example.com");
  const [created] = await db.select().from(catalogs);
  await db.delete(catalogs).where(eq(catalogs.id, created!.id));
  headerStore.current = new Headers({ cookie, origin });

  await requirePageSession("/dashboard");

  const [restored] = await db.select().from(catalogs);
  expect(restored?.ownerId).toBe(created?.ownerId);
  expect(restored?.revision).toBe(0);
  expect(await db.select().from(catalogCategories)).toHaveLength(0);
  expect(await db.select().from(catalogTracks)).toHaveLength(0);
  expect(await db.select().from(musicTracks)).toHaveLength(0);

  await db.update(catalogs).set({ revision: 3 }).where(eq(catalogs.id, restored!.id));
  await requirePageSession("/catalog");

  const [again] = await db.select().from(catalogs);
  expect(again?.id).toBe(restored?.id);
  expect(again?.revision).toBe(3);
  expect(await db.select().from(catalogCategories)).toHaveLength(0);
  expect(await db.select().from(catalogTracks)).toHaveLength(0);
});
