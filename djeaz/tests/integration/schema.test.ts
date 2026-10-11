import { eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, expect, test } from "vitest";

import * as schema from "@/db/schema";
import { account, catalogs, genres, rateLimits, session, tracks, user } from "@/db/schema";

import { resolveTestDatabaseUrl } from "./database";

const pool = new Pool({
  connectionString: resolveTestDatabaseUrl(),
  max: 1,
  connectionTimeoutMillis: 5_000,
});
const db = drizzle({ client: pool, schema });

afterAll(async () => {
  await pool.end();
});

function postgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && typeof current.code === "string" && /^\d{5}$/.test(current.code)) {
      return current.code;
    }
    current = "cause" in current ? current.cause : undefined;
  }

  return undefined;
}

async function expectPostgresCode(run: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await run();
  } catch (error) {
    expect(postgresErrorCode(error)).toBe(code);
    return;
  }

  throw new Error(`Attendu le code PostgreSQL ${code}.`);
}

async function insertUser(id: string, email: string): Promise<void> {
  await db.insert(user).values({
    id,
    name: "DJ",
    artistName: "DJ",
    email,
  });
}

test("un utilisateur ne peut avoir qu'un seul catalogue", async () => {
  await insertUser("user-1", "un@example.com");
  await insertUser("user-2", "deux@example.com");

  await db.insert(catalogs).values({ ownerId: "user-1", seedVersion: "ref-1" });
  const [other] = await db
    .insert(catalogs)
    .values({ ownerId: "user-2", seedVersion: "ref-1" })
    .returning();

  expect(other?.ownerId).toBe("user-2");
  expect(other?.revision).toBe(0);

  await expectPostgresCode(
    () => db.insert(catalogs).values({ ownerId: "user-1", seedVersion: "ref-2" }),
    "23505",
  );
});

test("le catalogue référence un utilisateur existant", async () => {
  await expectPostgresCode(
    () => db.insert(catalogs).values({ ownerId: "absent", seedVersion: "ref-1" }),
    "23503",
  );
});

test("un genre référence un catalogue et un morceau référence un genre", async () => {
  await insertUser("user-1", "un@example.com");
  const [catalog] = await db
    .insert(catalogs)
    .values({ ownerId: "user-1", seedVersion: "ref-1" })
    .returning();

  await expectPostgresCode(
    () =>
      db.insert(genres).values({
        catalogId: "00000000-0000-4000-8000-000000000000",
        name: "House",
        displayOrder: 0,
      }),
    "23503",
  );

  const [genre] = await db
    .insert(genres)
    .values({ catalogId: catalog!.id, name: "House", displayOrder: 0 })
    .returning();

  await expectPostgresCode(
    () =>
      db.insert(tracks).values({
        genreId: "00000000-0000-4000-8000-000000000000",
        title: "Titre",
        artist: "Artiste",
        displayOrder: 0,
      }),
    "23503",
  );

  const [track] = await db
    .insert(tracks)
    .values({
      genreId: genre!.id,
      title: "Titre",
      artist: "Artiste",
      displayOrder: 1,
    })
    .returning();

  expect(track?.genreId).toBe(genre!.id);
});

test("supprimer un genre supprime ses morceaux et bloque la suppression du catalogue", async () => {
  await insertUser("user-1", "un@example.com");
  const [catalog] = await db
    .insert(catalogs)
    .values({ ownerId: "user-1", seedVersion: "ref-1" })
    .returning();
  const [genre] = await db
    .insert(genres)
    .values({ catalogId: catalog!.id, name: "House", displayOrder: 0 })
    .returning();
  await db.insert(tracks).values({
    genreId: genre!.id,
    title: "Titre",
    artist: "Artiste",
    displayOrder: 0,
  });

  await expectPostgresCode(() => db.delete(catalogs).where(eq(catalogs.id, catalog!.id)), "23503");

  const genresAfterBlockedDelete = await db
    .select()
    .from(genres)
    .where(eq(genres.catalogId, catalog!.id));
  expect(genresAfterBlockedDelete).toHaveLength(1);

  await db.delete(genres).where(eq(genres.id, genre!.id));

  const remainingTracks = await db.select().from(tracks).where(eq(tracks.genreId, genre!.id));
  expect(remainingTracks).toHaveLength(0);

  await db.delete(catalogs).where(eq(catalogs.id, catalog!.id));
  const remainingCatalogs = await db.select().from(catalogs);
  expect(remainingCatalogs).toHaveLength(0);
});

test("un catalogue empêche la suppression de l'utilisateur ; sans catalogue, session et compte partent avec lui", async () => {
  await insertUser("user-1", "un@example.com");
  await db.insert(session).values({
    id: "session-1",
    expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    token: "token-1",
    updatedAt: new Date("2026-10-11T00:00:00.000Z"),
    userId: "user-1",
  });
  await db.insert(account).values({
    id: "account-1",
    accountId: "user-1",
    providerId: "credential",
    userId: "user-1",
    updatedAt: new Date("2026-10-11T00:00:00.000Z"),
  });
  await db.insert(catalogs).values({ ownerId: "user-1", seedVersion: "ref-1" });

  await expectPostgresCode(() => db.delete(user).where(eq(user.id, "user-1")), "23503");

  const catalogsAfter = await db.select().from(catalogs);
  expect(catalogsAfter).toHaveLength(1);

  await db.delete(catalogs);
  await db.delete(user).where(eq(user.id, "user-1"));

  const sessionsAfter = await db.select().from(session);
  const accountsAfter = await db.select().from(account);
  expect(sessionsAfter).toHaveLength(0);
  expect(accountsAfter).toHaveLength(0);
});

test("la limitation de débit distingue empreinte et opération, et les entrées expirées", async () => {
  const expiredAt = new Date("2020-01-01T00:00:00.000Z");
  const activeUntil = new Date("2099-01-01T00:00:00.000Z");

  await db.insert(rateLimits).values({
    fingerprint: "hash-a",
    operation: "survey.submit",
    count: 2,
    expiresAt: expiredAt,
  });
  await db.insert(rateLimits).values({
    fingerprint: "hash-a",
    operation: "auth.sign-in",
    count: 1,
    expiresAt: activeUntil,
  });
  await db.insert(rateLimits).values({
    fingerprint: "hash-b",
    operation: "survey.submit",
    count: 1,
    expiresAt: activeUntil,
  });

  await expectPostgresCode(
    () =>
      db.insert(rateLimits).values({
        fingerprint: "hash-a",
        operation: "survey.submit",
        count: 3,
        expiresAt: activeUntil,
      }),
    "23505",
  );

  const expired = await db.select().from(rateLimits).where(lte(rateLimits.expiresAt, new Date()));
  expect(expired.map((row) => row.operation)).toEqual(["survey.submit"]);

  await db.delete(rateLimits).where(lte(rateLimits.expiresAt, new Date()));

  const remaining = await db.select().from(rateLimits);
  expect(remaining).toHaveLength(2);
  expect(remaining.every((row) => row.expiresAt.getTime() > Date.now())).toBe(true);
});
