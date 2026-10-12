import { eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, expect, test } from "vitest";

import * as schema from "@/db/schema";
import {
  account,
  catalogCategories,
  catalogs,
  catalogTracks,
  musicGenres,
  musicTrackGenres,
  musicTracks,
  musicTrackSources,
  rateLimits,
  session,
  user,
} from "@/db/schema";

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

  await db.insert(catalogs).values({ ownerId: "user-1" });
  const [other] = await db.insert(catalogs).values({ ownerId: "user-2" }).returning();

  expect(other?.ownerId).toBe("user-2");
  expect(other?.revision).toBe(0);

  await expectPostgresCode(() => db.insert(catalogs).values({ ownerId: "user-1" }), "23505");
});

test("le catalogue référence un utilisateur existant", async () => {
  await expectPostgresCode(() => db.insert(catalogs).values({ ownerId: "absent" }), "23503");
});

test("une provenance et un lien morceau-genre ne peuvent pas être dupliqués", async () => {
  const [track] = await db
    .insert(musicTracks)
    .values({ title: "Titre synthétique", artist: "Artiste synthétique" })
    .returning();
  const [otherTrack] = await db
    .insert(musicTracks)
    .values({ title: "Autre titre", artist: "Autre artiste" })
    .returning();
  const [genre] = await db.insert(musicGenres).values({ name: "Genre synthétique" }).returning();

  await db.insert(musicTrackSources).values({
    musicTrackId: track!.id,
    provider: "synthetic",
    externalId: "ext-1",
  });
  await expectPostgresCode(
    () =>
      db.insert(musicTrackSources).values({
        musicTrackId: otherTrack!.id,
        provider: "synthetic",
        externalId: "ext-1",
      }),
    "23505",
  );

  await db.insert(musicTrackGenres).values({
    musicTrackId: track!.id,
    musicGenreId: genre!.id,
  });
  await expectPostgresCode(
    () =>
      db.insert(musicTrackGenres).values({
        musicTrackId: track!.id,
        musicGenreId: genre!.id,
      }),
    "23505",
  );
});

test("un morceau n'entre qu'une fois par catalogue, mais peut figurer dans deux catalogues", async () => {
  await insertUser("user-1", "un@example.com");
  await insertUser("user-2", "deux@example.com");
  const [track] = await db
    .insert(musicTracks)
    .values({ title: "Titre synthétique", artist: "Artiste synthétique" })
    .returning();
  const [catalogA] = await db.insert(catalogs).values({ ownerId: "user-1" }).returning();
  const [catalogB] = await db.insert(catalogs).values({ ownerId: "user-2" }).returning();
  const [categoryA] = await db
    .insert(catalogCategories)
    .values({ catalogId: catalogA!.id, name: "Cocktail", displayOrder: 0 })
    .returning();
  const [categoryB] = await db
    .insert(catalogCategories)
    .values({ catalogId: catalogB!.id, name: "Ouverture", displayOrder: 0 })
    .returning();

  await db.insert(catalogTracks).values({
    catalogId: catalogA!.id,
    categoryId: categoryA!.id,
    musicTrackId: track!.id,
    displayOrder: 0,
  });
  await db.insert(catalogTracks).values({
    catalogId: catalogB!.id,
    categoryId: categoryB!.id,
    musicTrackId: track!.id,
    displayOrder: 1,
  });

  await expectPostgresCode(
    () =>
      db.insert(catalogTracks).values({
        catalogId: catalogA!.id,
        categoryId: categoryA!.id,
        musicTrackId: track!.id,
        displayOrder: 2,
      }),
    "23505",
  );
});

test("PostgreSQL refuse une catégorie d'un autre catalogue", async () => {
  await insertUser("user-1", "un@example.com");
  await insertUser("user-2", "deux@example.com");
  const [track] = await db
    .insert(musicTracks)
    .values({ title: "Titre synthétique", artist: "Artiste synthétique" })
    .returning();
  const [catalogA] = await db.insert(catalogs).values({ ownerId: "user-1" }).returning();
  const [catalogB] = await db.insert(catalogs).values({ ownerId: "user-2" }).returning();
  const [categoryB] = await db
    .insert(catalogCategories)
    .values({ catalogId: catalogB!.id, name: "Rap FR", displayOrder: 0 })
    .returning();

  await expectPostgresCode(
    () =>
      db.insert(catalogTracks).values({
        catalogId: catalogA!.id,
        categoryId: categoryB!.id,
        musicTrackId: track!.id,
        displayOrder: 0,
      }),
    "23503",
  );
});

test("supprimer une catégorie retire ses associations et conserve le morceau global", async () => {
  await insertUser("user-1", "un@example.com");
  const [track] = await db
    .insert(musicTracks)
    .values({ title: "Titre synthétique", artist: "Artiste synthétique" })
    .returning();
  const [catalog] = await db.insert(catalogs).values({ ownerId: "user-1" }).returning();
  const [category] = await db
    .insert(catalogCategories)
    .values({ catalogId: catalog!.id, name: "Cocktail", displayOrder: 0 })
    .returning();
  await db.insert(catalogTracks).values({
    catalogId: catalog!.id,
    categoryId: category!.id,
    musicTrackId: track!.id,
    displayOrder: 0,
  });

  await expectPostgresCode(() => db.delete(catalogs).where(eq(catalogs.id, catalog!.id)), "23503");
  await expectPostgresCode(
    () => db.delete(musicTracks).where(eq(musicTracks.id, track!.id)),
    "23503",
  );

  await db.delete(catalogCategories).where(eq(catalogCategories.id, category!.id));

  const remainingAssociations = await db.select().from(catalogTracks);
  const remainingTracks = await db.select().from(musicTracks);
  expect(remainingAssociations).toHaveLength(0);
  expect(remainingTracks).toHaveLength(1);

  await db.delete(catalogs).where(eq(catalogs.id, catalog!.id));
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
  await db.insert(catalogs).values({ ownerId: "user-1" });

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
