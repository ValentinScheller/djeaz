import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db/client.server";
import {
  account,
  catalogCategories,
  catalogs,
  catalogTracks,
  musicGenres,
  musicTrackGenres,
  musicTrackSources,
  musicTracks,
  rateLimit,
  session,
  user,
  verification,
} from "@/db/schema";
import { auth } from "@/features/auth/server";
import { seedSyntheticDemo } from "@/scripts/seed-demo";

const origin = "http://127.0.0.1:3100";
const DEMO_EMAIL = "demo@djeaz.example";
const DEMO_PASSWORD = "demo-djeaz-2026";

const SEEDED_TRACKS = [
  { title: "Nuit Indigo", artist: "Nova Avenue", genres: ["Pop"] },
  { title: "Éclats d'été", artist: "Luna Park", genres: ["Electronic", "Pop"] },
  { title: "Dernier Métro", artist: "Atlas Club", genres: ["Funk"] },
  { title: "Velours", artist: "Satellite Club", genres: ["Funk"] },
  { title: "Minuit solaire", artist: "Neon Coast", genres: ["Electronic"] },
  { title: "Dernière danse", artist: "Studio Mirage", genres: ["Electronic", "Pop"] },
] as const;

const SEEDED_CATEGORIES = [
  { name: "Cocktail", displayOrder: 0, titles: ["Nuit Indigo", "Velours"] },
  {
    name: "Dancefloor",
    displayOrder: 1,
    titles: ["Éclats d'été", "Minuit solaire", "Dernière danse"],
  },
  { name: "Fin de soirée", displayOrder: 2, titles: ["Dernier Métro"] },
] as const;

const networkCalls: string[] = [];

beforeEach(() => {
  networkCalls.length = 0;
  vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
    networkCalls.push(String(input));
    return Promise.reject(new Error("réseau interdit"));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function byId<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => left.id.localeCompare(right.id));
}

async function postAuth(
  path: "/sign-up/email" | "/sign-in/email",
  body: Record<string, unknown>,
  ip: string,
): Promise<Response> {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    }),
  );
}

async function expectNoNetwork(): Promise<void> {
  expect(networkCalls).toEqual([]);
}

async function seededTrackIds(): Promise<Map<string, string>> {
  const rows = await db.select().from(musicTracks);
  return new Map(rows.map((row) => [row.title, row.id]));
}

async function expectSeededLibrary(): Promise<void> {
  const genres = await db.select().from(musicGenres);
  const tracks = await db.select().from(musicTracks);
  const links = await db.select().from(musicTrackGenres);
  const sources = await db.select().from(musicTrackSources);
  const ids = new Map(tracks.map((track) => [track.title, track.id]));
  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));

  for (const name of ["Pop", "Funk", "Electronic"]) {
    expect(genres.filter((genre) => genre.name === name)).toHaveLength(1);
  }

  for (const expected of SEEDED_TRACKS) {
    const track = tracks.find(
      (row) => row.title === expected.title && row.artist === expected.artist,
    );
    expect(track).toBeDefined();
    expect(track?.albumTitle).toBeNull();
    expect(track?.artworkUrl).toBeNull();
    expect(track?.artworkProvider).toBeNull();
    expect(track?.isrc).toBeNull();
    expect(track?.durationMs).toBeNull();

    const linked = links
      .filter((link) => link.musicTrackId === track?.id)
      .map((link) => genreNames.get(link.musicGenreId))
      .sort();
    expect(linked).toEqual([...expected.genres]);
  }

  const seededIds = new Set(
    SEEDED_TRACKS.map((track) => ids.get(track.title)).filter((id) => id !== undefined),
  );
  expect(sources.filter((source) => seededIds.has(source.musicTrackId))).toEqual([]);
}

async function expectSeededCatalog(catalogId: string): Promise<void> {
  const categories = await db
    .select()
    .from(catalogCategories)
    .where(eq(catalogCategories.catalogId, catalogId));
  const associations = await db
    .select()
    .from(catalogTracks)
    .where(eq(catalogTracks.catalogId, catalogId));
  const ids = await seededTrackIds();
  const seenTracks = associations.map((row) => row.musicTrackId);

  expect(new Set(seenTracks).size).toBe(seenTracks.length);

  for (const expected of SEEDED_CATEGORIES) {
    const category = categories.find((row) => row.name === expected.name);
    expect(category?.catalogId).toBe(catalogId);
    expect(category?.displayOrder).toBe(expected.displayOrder);

    const titles = associations
      .filter((row) => row.categoryId === category?.id)
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((row) => {
        const match = [...ids.entries()].find(([, id]) => id === row.musicTrackId);
        return match?.[0];
      });
    expect(titles).toEqual([...expected.titles]);
  }
}

async function identitySnapshot() {
  const [
    users,
    accounts,
    sessions,
    verifications,
    limits,
    catalogRows,
    genres,
    tracks,
    links,
    categories,
    associations,
    sources,
  ] = await Promise.all([
    db.select().from(user),
    db.select().from(account),
    db.select().from(session),
    db.select().from(verification),
    db.select().from(rateLimit),
    db.select().from(catalogs),
    db.select().from(musicGenres),
    db.select().from(musicTracks),
    db.select().from(musicTrackGenres),
    db.select().from(catalogCategories),
    db.select().from(catalogTracks),
    db.select().from(musicTrackSources),
  ]);

  return {
    users: byId(users),
    accounts: byId(accounts),
    sessions: byId(sessions),
    verifications: byId(verifications),
    limits: byId(limits),
    catalogRows: byId(catalogRows),
    genres: byId(genres),
    tracks: byId(tracks),
    links: [...links].sort((left, right) =>
      `${left.musicTrackId}:${left.musicGenreId}`.localeCompare(
        `${right.musicTrackId}:${right.musicGenreId}`,
      ),
    ),
    categories: byId(categories),
    associations: byId(associations),
    sources: byId(sources),
  };
}

test("une base vide reçoit le DJ démo et des fixtures stables, sans réseau", async () => {
  await seedSyntheticDemo();
  await expectNoNetwork();

  const [demo] = await db.select().from(user);
  const [demoAccount] = await db.select().from(account);
  const [catalog] = await db.select().from(catalogs);
  const genres = await db.select().from(musicGenres);
  const tracks = await db.select().from(musicTracks);
  const categories = await db.select().from(catalogCategories);
  const sources = await db.select().from(musicTrackSources);

  expect(demo?.email).toBe(DEMO_EMAIL);
  expect(demo?.name).toBe("Compte Démo");
  expect(demo?.artistName).toBe("DJ Démo");
  expect(demoAccount?.userId).toBe(demo?.id);
  expect(demoAccount?.providerId).toBe("credential");
  expect(demoAccount?.password).toEqual(expect.any(String));
  expect(demoAccount?.password).not.toBe(DEMO_PASSWORD);
  expect(await db.select().from(catalogs)).toHaveLength(1);
  expect(catalog?.ownerId).toBe(demo?.id);
  expect(catalog?.revision).toBe(0);
  expect(genres).toHaveLength(3);
  expect(tracks).toHaveLength(6);
  expect(categories).toHaveLength(3);
  expect(sources).toHaveLength(0);
  await expectSeededLibrary();
  await expectSeededCatalog(catalog!.id);

  const signIn = await postAuth(
    "/sign-in/email",
    { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    "203.0.113.78",
  );
  expect(signIn.status).toBe(200);

  networkCalls.length = 0;
  const first = await identitySnapshot();
  await seedSyntheticDemo();
  await expectNoNetwork();
  const second = await identitySnapshot();

  expect(second).toEqual(first);
  expect(second.catalogRows).toHaveLength(1);
  expect(second.catalogRows[0]?.revision).toBe(0);
  expect(second.users).toHaveLength(1);
});

test("relancer le seed préserve les données hors fixtures et un autre DJ", async () => {
  const otherSignUp = await postAuth(
    "/sign-up/email",
    {
      name: "Alex Bernard",
      artistName: "DJ Rivage",
      email: "autre-dj@example.com",
      password: "a".repeat(8),
    },
    "203.0.113.81",
  );
  expect(otherSignUp.status).toBe(200);

  const demoSignUp = await postAuth(
    "/sign-up/email",
    {
      name: "Compte Démo",
      artistName: "DJ Démo",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    },
    "203.0.113.82",
  );
  expect(demoSignUp.status).toBe(200);

  const [other] = await db.select().from(user).where(eq(user.email, "autre-dj@example.com"));
  const [demo] = await db.select().from(user).where(eq(user.email, DEMO_EMAIL));
  const [otherCatalog] = await db.select().from(catalogs).where(eq(catalogs.ownerId, other!.id));
  const [demoCatalog] = await db.select().from(catalogs).where(eq(catalogs.ownerId, demo!.id));

  await db.update(account).set({ password: "hash-existant" }).where(eq(account.userId, demo!.id));
  await db
    .update(user)
    .set({ name: "Nom modifié", artistName: "Artiste modifié" })
    .where(eq(user.id, demo!.id));
  await db.update(catalogs).set({ revision: 8 }).where(eq(catalogs.id, demoCatalog!.id));
  await db.update(catalogs).set({ revision: 5 }).where(eq(catalogs.id, otherCatalog!.id));

  await db.insert(catalogCategories).values({
    id: "b3000000-0000-4000-8000-000000000099",
    catalogId: demoCatalog!.id,
    name: "Perso",
    displayOrder: 9,
  });
  await db.insert(musicTracks).values({
    id: "b2000000-0000-4000-8000-000000000099",
    title: "Signal fantôme",
    artist: "Orchestre fictif",
  });
  await db.insert(musicTrackSources).values({
    id: "b5000000-0000-4000-8000-000000000099",
    musicTrackId: "b2000000-0000-4000-8000-000000000099",
    provider: "manual-test",
    externalId: "not-from-seed",
  });
  await db.insert(musicTracks).values({
    id: "b2000000-0000-4000-8000-000000000098",
    title: "Balcon fermé",
    artist: "Groupe absent",
  });
  await db.insert(catalogCategories).values({
    id: "b3000000-0000-4000-8000-000000000098",
    catalogId: otherCatalog!.id,
    name: "Balcon",
    displayOrder: 0,
  });
  await db.insert(catalogTracks).values({
    id: "b4000000-0000-4000-8000-000000000098",
    catalogId: otherCatalog!.id,
    categoryId: "b3000000-0000-4000-8000-000000000098",
    musicTrackId: "b2000000-0000-4000-8000-000000000098",
    displayOrder: 0,
  });

  const before = await identitySnapshot();
  await seedSyntheticDemo();
  const after = await identitySnapshot();

  const demoAfter = after.users.find((row) => row.id === demo?.id);
  const otherAfter = after.users.find((row) => row.id === other?.id);
  const demoCatalogAfter = after.catalogRows.find((row) => row.id === demoCatalog?.id);
  const otherCatalogAfter = after.catalogRows.find((row) => row.id === otherCatalog?.id);
  const demoAccountAfter = after.accounts.find((row) => row.userId === demo?.id);

  expect(demoAfter).toEqual(before.users.find((row) => row.id === demo?.id));
  expect(demoAfter?.name).toBe("Nom modifié");
  expect(demoAfter?.artistName).toBe("Artiste modifié");
  expect(demoAccountAfter?.password).toBe("hash-existant");
  expect(demoCatalogAfter).toEqual(before.catalogRows.find((row) => row.id === demoCatalog?.id));
  expect(demoCatalogAfter?.revision).toBe(8);
  expect(after.catalogRows.filter((row) => row.ownerId === demo?.id)).toHaveLength(1);

  expect(otherAfter).toEqual(before.users.find((row) => row.id === other?.id));
  expect(otherCatalogAfter).toEqual(before.catalogRows.find((row) => row.id === otherCatalog?.id));
  expect(otherCatalogAfter?.revision).toBe(5);
  expect(after.categories.filter((row) => row.catalogId === otherCatalog?.id)).toEqual(
    before.categories.filter((row) => row.catalogId === otherCatalog?.id),
  );
  expect(after.associations.filter((row) => row.catalogId === otherCatalog?.id)).toEqual(
    before.associations.filter((row) => row.catalogId === otherCatalog?.id),
  );

  expect(after.tracks.find((row) => row.id === "b2000000-0000-4000-8000-000000000099")).toEqual(
    before.tracks.find((row) => row.id === "b2000000-0000-4000-8000-000000000099"),
  );
  expect(after.sources).toEqual(before.sources);
  expect(after.categories.find((row) => row.name === "Perso")).toEqual(
    before.categories.find((row) => row.name === "Perso"),
  );

  await expectSeededLibrary();
  await expectSeededCatalog(demoCatalog!.id);
  expect(after.categories.filter((row) => row.catalogId === demoCatalog?.id)).toHaveLength(4);
  await expectNoNetwork();

  const signIn = await postAuth(
    "/sign-in/email",
    { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    "203.0.113.83",
  );
  expect(signIn.status).not.toBe(200);
});
