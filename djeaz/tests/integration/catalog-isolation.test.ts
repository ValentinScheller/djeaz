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
import { PASSWORD_MIN_LENGTH } from "@/features/auth/password-policy";
import { auth } from "@/features/auth/server";
import { getAuthenticatedSession, requirePageSession } from "@/features/auth/session.server";
import {
  getCatalogForUser,
  getCatalogTrackForUser,
  getCategoryForUser,
  listCatalogTracksForUser,
  listCategoriesForUser,
} from "@/features/catalog/queries.server";

const origin = "http://127.0.0.1:3100";
const validPassword = "a".repeat(PASSWORD_MIN_LENGTH);
const MISSING_ID = "00000000-0000-4000-8000-000000000000";
const NOT_FOUND = {
  ok: false,
  error: { code: "NOT_FOUND", message: "Introuvable." },
};

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function cookiePair(setCookie: string): string {
  return setCookie.split(";", 1)[0] ?? "";
}

async function signUp(email: string, forwardedFor: string): Promise<string> {
  const response = await auth.handler(
    new Request(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": forwardedFor,
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

async function insertOwner(id: string, email: string) {
  await db.insert(user).values({
    id,
    name: "DJ",
    artistName: id,
    email,
  });
  const [catalog] = await db.insert(catalogs).values({ ownerId: id }).returning();
  if (!catalog) {
    throw new Error("Catalogue absent.");
  }
  return catalog;
}

async function insertCategory(catalogId: string, name: string, displayOrder: number) {
  const [category] = await db
    .insert(catalogCategories)
    .values({ catalogId, name, displayOrder })
    .returning();
  if (!category) {
    throw new Error("Catégorie absente.");
  }
  return category;
}

async function insertTrack(title: string) {
  const [track] = await db
    .insert(musicTracks)
    .values({ title, artist: "Artiste synthétique" })
    .returning();
  if (!track) {
    throw new Error("Morceau absent.");
  }
  return track;
}

async function insertAssociation(
  catalogId: string,
  categoryId: string,
  musicTrackId: string,
  displayOrder: number,
) {
  const [association] = await db
    .insert(catalogTracks)
    .values({ catalogId, categoryId, musicTrackId, displayOrder })
    .returning();
  if (!association) {
    throw new Error("Association absente.");
  }
  return association;
}

test("chaque DJ ne résout que son catalogue", async () => {
  const catalogA = await insertOwner("dj-a", "dj-a@example.com");
  const catalogB = await insertOwner("dj-b", "dj-b@example.com");

  const forA = await getCatalogForUser("dj-a");
  const forB = await getCatalogForUser("dj-b");

  expect(forA).toEqual({ ok: true, data: catalogA });
  expect(forB).toEqual({ ok: true, data: catalogB });
  expect(await getCatalogForUser("dj-absent")).toEqual(NOT_FOUND);

  if (!forA.ok || !forB.ok) {
    throw new Error("Catalogues attendus.");
  }

  expect(forA.data.id).not.toBe(forB.data.id);
  expect(forA.data.ownerId).toBe("dj-a");
  expect(forB.data.ownerId).toBe("dj-b");
});

test("une catégorie d'un autre DJ est introuvable, comme un id absent", async () => {
  const catalogA = await insertOwner("dj-a", "dj-a@example.com");
  const catalogB = await insertOwner("dj-b", "dj-b@example.com");
  const first = await insertCategory(catalogA.id, "Cocktail", 0);
  const later = await insertCategory(catalogA.id, "Ouverture", 1);
  const foreign = await insertCategory(catalogB.id, "Rap FR", 0);

  // La ligne de B existe. Sans filtre propriétaire, elle est lisible :
  // l'isolation ne vient pas des clés étrangères.
  const [stored] = await db
    .select()
    .from(catalogCategories)
    .where(eq(catalogCategories.id, foreign.id));
  expect(stored?.catalogId).toBe(catalogB.id);

  const owned = await getCategoryForUser("dj-a", first.id);
  const otherDj = await getCategoryForUser("dj-a", foreign.id);
  const missing = await getCategoryForUser("dj-a", MISSING_ID);
  const malformed = await getCategoryForUser("dj-a", "pas-un-uuid");

  expect(owned).toEqual({
    ok: true,
    data: {
      id: first.id,
      catalogId: catalogA.id,
      name: "Cocktail",
      displayOrder: 0,
    },
  });
  expect(otherDj).toEqual(NOT_FOUND);
  expect(missing).toEqual(NOT_FOUND);
  expect(malformed).toEqual(NOT_FOUND);
  expect(otherDj).toEqual(missing);
  expect(otherDj).toEqual(malformed);

  expect(await listCategoriesForUser("dj-a")).toEqual([
    { id: first.id, catalogId: catalogA.id, name: "Cocktail", displayOrder: 0 },
    { id: later.id, catalogId: catalogA.id, name: "Ouverture", displayOrder: 1 },
  ]);
  expect(await listCategoriesForUser("dj-b")).toEqual([
    { id: foreign.id, catalogId: catalogB.id, name: "Rap FR", displayOrder: 0 },
  ]);
  expect(await listCategoriesForUser("dj-absent")).toEqual([]);
});

test("une association d'un autre DJ est introuvable, comme un id absent", async () => {
  const catalogA = await insertOwner("dj-a", "dj-a@example.com");
  const catalogB = await insertOwner("dj-b", "dj-b@example.com");
  const categoryA = await insertCategory(catalogA.id, "Cocktail", 0);
  const categoryB = await insertCategory(catalogB.id, "Rap FR", 0);
  const opening = await insertTrack("Ouverture");
  const closing = await insertTrack("Fin de soirée");
  const foreignTrack = await insertTrack("Rap");
  const first = await insertAssociation(catalogA.id, categoryA.id, opening.id, 0);
  const later = await insertAssociation(catalogA.id, categoryA.id, closing.id, 1);
  const foreign = await insertAssociation(catalogB.id, categoryB.id, foreignTrack.id, 0);

  const [stored] = await db.select().from(catalogTracks).where(eq(catalogTracks.id, foreign.id));
  expect(stored?.catalogId).toBe(catalogB.id);

  const owned = await getCatalogTrackForUser("dj-a", first.id);
  const otherDj = await getCatalogTrackForUser("dj-a", foreign.id);
  const missing = await getCatalogTrackForUser("dj-a", MISSING_ID);
  const malformed = await getCatalogTrackForUser("dj-a", "pas-un-uuid");

  expect(owned).toEqual({
    ok: true,
    data: {
      id: first.id,
      catalogId: catalogA.id,
      categoryId: categoryA.id,
      musicTrackId: opening.id,
      displayOrder: 0,
    },
  });
  expect(otherDj).toEqual(NOT_FOUND);
  expect(missing).toEqual(NOT_FOUND);
  expect(malformed).toEqual(NOT_FOUND);
  expect(otherDj).toEqual(missing);
  expect(otherDj).toEqual(malformed);

  expect(await listCatalogTracksForUser("dj-a")).toEqual([
    {
      id: first.id,
      catalogId: catalogA.id,
      categoryId: categoryA.id,
      musicTrackId: opening.id,
      displayOrder: 0,
    },
    {
      id: later.id,
      catalogId: catalogA.id,
      categoryId: categoryA.id,
      musicTrackId: closing.id,
      displayOrder: 1,
    },
  ]);
  expect(await listCatalogTracksForUser("dj-b")).toEqual([
    {
      id: foreign.id,
      catalogId: catalogB.id,
      categoryId: categoryB.id,
      musicTrackId: foreignTrack.id,
      displayOrder: 0,
    },
  ]);
  expect(await listCatalogTracksForUser("dj-absent")).toEqual([]);
});

test("un morceau global peut être référencé par deux catalogues, sans propriétaire", async () => {
  const catalogA = await insertOwner("dj-a", "dj-a@example.com");
  const catalogB = await insertOwner("dj-b", "dj-b@example.com");
  const categoryA = await insertCategory(catalogA.id, "Cocktail", 0);
  const categoryB = await insertCategory(catalogB.id, "Ouverture", 0);
  const shared = await insertTrack("Morceau partagé");
  const associationA = await insertAssociation(catalogA.id, categoryA.id, shared.id, 0);
  const associationB = await insertAssociation(catalogB.id, categoryB.id, shared.id, 0);

  const forA = await getCatalogTrackForUser("dj-a", associationA.id);
  const forB = await getCatalogTrackForUser("dj-b", associationB.id);
  const hiddenFromA = await getCatalogTrackForUser("dj-a", associationB.id);

  expect(forA).toMatchObject({ ok: true, data: { musicTrackId: shared.id } });
  expect(forB).toMatchObject({ ok: true, data: { musicTrackId: shared.id } });
  expect(hiddenFromA).toEqual(NOT_FOUND);
  expect(hiddenFromA).toEqual(await getCatalogTrackForUser("dj-a", MISSING_ID));

  const tracks = await db.select().from(musicTracks);
  expect(tracks).toHaveLength(1);
  expect(tracks[0]?.id).toBe(shared.id);
  expect(tracks[0]).not.toHaveProperty("ownerId");

  const ownerColumns = await db.$client.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
       AND column_name = ANY($2::text[])`,
    [
      ["music_tracks", "music_track_sources", "music_genres", "music_track_genres"],
      ["owner_id", "catalog_id", "user_id"],
    ],
  );
  expect(ownerColumns.rows).toEqual([]);
});

test("un ownerId forgé n'influence pas le propriétaire issu de la session", async () => {
  const cookieA = await signUp("session-a@example.com", "203.0.113.61");
  const cookieB = await signUp("session-b@example.com", "203.0.113.62");
  const [userA] = await db.select().from(user).where(eq(user.email, "session-a@example.com"));
  const [userB] = await db.select().from(user).where(eq(user.email, "session-b@example.com"));
  const [catalogA] = await db.select().from(catalogs).where(eq(catalogs.ownerId, userA!.id));
  const [catalogB] = await db.select().from(catalogs).where(eq(catalogs.ownerId, userB!.id));
  const foreign = await insertCategory(catalogB!.id, "Rap FR", 0);

  await db.delete(catalogs).where(eq(catalogs.id, catalogA!.id));
  await db.update(catalogs).set({ revision: 4 }).where(eq(catalogs.id, catalogB!.id));

  headerStore.current = new Headers({
    cookie: cookieA,
    origin,
    "x-owner-id": userB!.id,
    "x-user-id": userB!.id,
  });

  const session = await getAuthenticatedSession();

  expect(headerStore.current.get("x-owner-id")).toBe(userB!.id);
  expect(session).toMatchObject({
    ok: true,
    data: { user: { id: userA!.id }, session: { userId: userA!.id } },
  });
  if (!session.ok) {
    throw new Error("Session attendue.");
  }
  expect(session.data.user.id).not.toBe(headerStore.current.get("x-owner-id"));

  await requirePageSession("/catalog");

  const restored = await getCatalogForUser(session.data.user.id);
  const other = await getCatalogForUser(userB!.id);

  expect(restored).toMatchObject({ ok: true, data: { ownerId: userA!.id, revision: 0 } });
  expect(other).toMatchObject({
    ok: true,
    data: { id: catalogB!.id, ownerId: userB!.id, revision: 4 },
  });
  if (restored.ok) {
    expect(restored.data.id).not.toBe(catalogB!.id);
  }
  expect(await db.select().from(catalogs)).toHaveLength(2);
  expect(await listCategoriesForUser(session.data.user.id)).toEqual([]);
  expect(await getCategoryForUser(session.data.user.id, foreign.id)).toEqual(NOT_FOUND);
  expect(await getCategoryForUser(session.data.user.id, foreign.id)).toEqual(
    await getCategoryForUser(session.data.user.id, MISSING_ID),
  );
  expect(await listCategoriesForUser(userB!.id)).toEqual([
    { id: foreign.id, catalogId: catalogB!.id, name: "Rap FR", displayOrder: 0 },
  ]);

  headerStore.current = new Headers({
    cookie: cookieB,
    origin,
    "x-owner-id": userA!.id,
  });
  const sessionB = await getAuthenticatedSession();
  expect(sessionB).toMatchObject({ ok: true, data: { user: { id: userB!.id } } });
});
