import { and, eq } from "drizzle-orm";

import { db } from "@/db/client.server";
import {
  catalogCategories,
  catalogTracks,
  musicGenres,
  musicTrackGenres,
  musicTracks,
  user,
} from "@/db/schema";
import { auth } from "@/features/auth/server";
import { ensureCatalogForUser } from "@/features/catalog/ensure-catalog.server";
import { getServerEnv } from "@/lib/env.server";

// Compte de développement, pas un secret. Better Auth crée le hash ; ce module
// n'écrit jamais les tables `user` / `account` lui-même.
const DEMO_EMAIL = "demo@djeaz.example";
const DEMO_PASSWORD = "demo-djeaz-2026";
const DEMO_NAME = "Compte Démo";
const DEMO_ARTIST_NAME = "DJ Démo";
const DEMO_SIGN_UP_IP = "203.0.113.77";
const ALREADY_EXISTS_CODE = "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";

// UUID fixes : une seconde exécution retrouve les mêmes lignes au lieu d'en créer.
const GENRES = [
  { id: "a1000000-0000-4000-8000-000000000001", name: "Pop" },
  { id: "a1000000-0000-4000-8000-000000000002", name: "Funk" },
  { id: "a1000000-0000-4000-8000-000000000003", name: "Electronic" },
] as const;

const TRACKS = [
  {
    id: "a2000000-0000-4000-8000-000000000001",
    title: "Nuit Indigo",
    artist: "Nova Avenue",
    genreNames: ["Pop"],
  },
  {
    id: "a2000000-0000-4000-8000-000000000002",
    title: "Éclats d'été",
    artist: "Luna Park",
    genreNames: ["Pop", "Electronic"],
  },
  {
    id: "a2000000-0000-4000-8000-000000000003",
    title: "Dernier Métro",
    artist: "Atlas Club",
    genreNames: ["Funk"],
  },
  {
    id: "a2000000-0000-4000-8000-000000000004",
    title: "Velours",
    artist: "Satellite Club",
    genreNames: ["Funk"],
  },
  {
    id: "a2000000-0000-4000-8000-000000000005",
    title: "Minuit solaire",
    artist: "Neon Coast",
    genreNames: ["Electronic"],
  },
  {
    id: "a2000000-0000-4000-8000-000000000006",
    title: "Dernière danse",
    artist: "Studio Mirage",
    genreNames: ["Pop", "Electronic"],
  },
] as const;

const CATEGORIES = [
  {
    id: "a3000000-0000-4000-8000-000000000001",
    name: "Cocktail",
    displayOrder: 0,
    tracks: [
      { id: "a4000000-0000-4000-8000-000000000001", title: "Nuit Indigo", displayOrder: 0 },
      { id: "a4000000-0000-4000-8000-000000000002", title: "Velours", displayOrder: 1 },
    ],
  },
  {
    id: "a3000000-0000-4000-8000-000000000002",
    name: "Dancefloor",
    displayOrder: 1,
    tracks: [
      { id: "a4000000-0000-4000-8000-000000000003", title: "Éclats d'été", displayOrder: 0 },
      { id: "a4000000-0000-4000-8000-000000000004", title: "Minuit solaire", displayOrder: 1 },
      { id: "a4000000-0000-4000-8000-000000000005", title: "Dernière danse", displayOrder: 2 },
    ],
  },
  {
    id: "a3000000-0000-4000-8000-000000000003",
    name: "Fin de soirée",
    displayOrder: 2,
    tracks: [
      { id: "a4000000-0000-4000-8000-000000000006", title: "Dernier Métro", displayOrder: 0 },
    ],
  },
] as const;

type IdRow = { id: string };

function assertEachTrackOnce(): void {
  const placed = CATEGORIES.flatMap((category) => category.tracks.map((track) => track.title));
  const known = new Set(TRACKS.map((track) => track.title));
  const unique = new Set(placed);

  const coversEachTrackOnce =
    unique.size === placed.length &&
    unique.size === known.size &&
    placed.every((title) => known.has(title));

  if (!coversEachTrackOnce) {
    throw new Error("Les fixtures de catalogue ne couvrent pas chaque morceau une seule fois.");
  }
}

async function readId(query: Promise<IdRow[]>): Promise<string | undefined> {
  const [row] = await query;
  return row?.id;
}

async function ensureGenre(genre: (typeof GENRES)[number]): Promise<string> {
  const byId = () =>
    db
      .select({ id: musicGenres.id })
      .from(musicGenres)
      .where(eq(musicGenres.id, genre.id))
      .limit(1);
  const byName = () =>
    db
      .select({ id: musicGenres.id })
      .from(musicGenres)
      .where(eq(musicGenres.name, genre.name))
      .limit(1);

  const existing = (await readId(byId())) ?? (await readId(byName()));
  if (existing) {
    return existing;
  }

  await db.insert(musicGenres).values(genre).onConflictDoNothing({ target: musicGenres.id });

  const created = (await readId(byId())) ?? (await readId(byName()));
  if (!created) {
    throw new Error(`Genre synthétique introuvable : ${genre.name}.`);
  }
  return created;
}

async function ensureTrack(track: (typeof TRACKS)[number]): Promise<string> {
  const byId = () =>
    db
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(eq(musicTracks.id, track.id))
      .limit(1);
  const byTitle = () =>
    db
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(and(eq(musicTracks.title, track.title), eq(musicTracks.artist, track.artist)))
      .limit(1);

  const existing = (await readId(byId())) ?? (await readId(byTitle()));
  if (existing) {
    return existing;
  }

  await db
    .insert(musicTracks)
    .values({ id: track.id, title: track.title, artist: track.artist })
    .onConflictDoNothing({ target: musicTracks.id });

  const created = (await readId(byId())) ?? (await readId(byTitle()));
  if (!created) {
    throw new Error(`Morceau synthétique introuvable : ${track.title}.`);
  }
  return created;
}

async function ensureGenreLink(musicTrackId: string, musicGenreId: string): Promise<void> {
  await db.insert(musicTrackGenres).values({ musicTrackId, musicGenreId }).onConflictDoNothing();
}

async function ensureLibrary(): Promise<Map<string, string>> {
  const genreIds = new Map<string, string>();
  for (const genre of GENRES) {
    genreIds.set(genre.name, await ensureGenre(genre));
  }

  const trackIds = new Map<string, string>();
  for (const track of TRACKS) {
    const trackId = await ensureTrack(track);
    trackIds.set(track.title, trackId);
    for (const genreName of track.genreNames) {
      const genreId = genreIds.get(genreName);
      if (!genreId) {
        throw new Error(`Genre synthétique inconnu : ${genreName}.`);
      }
      await ensureGenreLink(trackId, genreId);
    }
  }

  return trackIds;
}

async function readAuthErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : undefined;
  } catch {
    return undefined;
  }
}

async function readDemoUserId(): Promise<string | undefined> {
  return readId(db.select({ id: user.id }).from(user).where(eq(user.email, DEMO_EMAIL)).limit(1));
}

// Inscription en processus via le handler Better Auth, le même chemin que les
// Server Actions. Aucune requête HTTP sortante. Un compte déjà présent n'est
// ni recréé ni réécrit : le mot de passe existant reste en place.
async function ensureDemoUser(): Promise<string> {
  const existingId = await readDemoUserId();
  if (existingId) {
    return existingId;
  }

  const env = getServerEnv();
  const origin = new URL(env.BETTER_AUTH_URL).origin;
  const response = await auth.handler(
    new Request(new URL("/api/auth/sign-up/email", env.BETTER_AUTH_URL), {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": DEMO_SIGN_UP_IP,
      },
      body: JSON.stringify({
        name: DEMO_NAME,
        artistName: DEMO_ARTIST_NAME,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      }),
    }),
  );

  if (!response.ok) {
    const code = await readAuthErrorCode(response);
    if (code === ALREADY_EXISTS_CODE) {
      const racedId = await readDemoUserId();
      if (racedId) {
        return racedId;
      }
    }

    throw new Error(
      `Création du compte démo impossible (statut ${response.status}${code ? `, code ${code}` : ""}).`,
    );
  }

  const createdId = await readDemoUserId();
  if (!createdId) {
    throw new Error("Compte démo introuvable après l'inscription.");
  }
  return createdId;
}

async function ensureCategory(
  catalogId: string,
  category: (typeof CATEGORIES)[number],
): Promise<string> {
  const [byId] = await db
    .select({ id: catalogCategories.id, catalogId: catalogCategories.catalogId })
    .from(catalogCategories)
    .where(eq(catalogCategories.id, category.id))
    .limit(1);

  if (byId) {
    if (byId.catalogId !== catalogId) {
      throw new Error(
        `La catégorie synthétique « ${category.name} » appartient à un autre catalogue.`,
      );
    }
    return byId.id;
  }

  const [byName] = await db
    .select({ id: catalogCategories.id })
    .from(catalogCategories)
    .where(
      and(eq(catalogCategories.catalogId, catalogId), eq(catalogCategories.name, category.name)),
    )
    .limit(1);
  if (byName) {
    return byName.id;
  }

  await db
    .insert(catalogCategories)
    .values({
      id: category.id,
      catalogId,
      name: category.name,
      displayOrder: category.displayOrder,
    })
    .onConflictDoNothing({ target: catalogCategories.id });

  const [created] = await db
    .select({ id: catalogCategories.id, catalogId: catalogCategories.catalogId })
    .from(catalogCategories)
    .where(eq(catalogCategories.id, category.id))
    .limit(1);
  if (created) {
    if (created.catalogId !== catalogId) {
      throw new Error(
        `La catégorie synthétique « ${category.name} » appartient à un autre catalogue.`,
      );
    }
    return created.id;
  }

  const adopted = await readId(
    db
      .select({ id: catalogCategories.id })
      .from(catalogCategories)
      .where(
        and(eq(catalogCategories.catalogId, catalogId), eq(catalogCategories.name, category.name)),
      )
      .limit(1),
  );
  if (!adopted) {
    throw new Error(`Catégorie synthétique introuvable : ${category.name}.`);
  }
  return adopted;
}

async function ensureCatalogTrack(input: {
  id: string;
  catalogId: string;
  categoryId: string;
  musicTrackId: string;
  displayOrder: number;
}): Promise<void> {
  const [pair] = await db
    .select({ id: catalogTracks.id })
    .from(catalogTracks)
    .where(
      and(
        eq(catalogTracks.catalogId, input.catalogId),
        eq(catalogTracks.musicTrackId, input.musicTrackId),
      ),
    )
    .limit(1);
  if (pair) {
    return;
  }

  const [byId] = await db
    .select({
      id: catalogTracks.id,
      catalogId: catalogTracks.catalogId,
      musicTrackId: catalogTracks.musicTrackId,
    })
    .from(catalogTracks)
    .where(eq(catalogTracks.id, input.id))
    .limit(1);

  if (byId && (byId.catalogId !== input.catalogId || byId.musicTrackId !== input.musicTrackId)) {
    throw new Error("Une association synthétique existe déjà pour une autre cible.");
  }
  if (byId) {
    return;
  }

  await db.insert(catalogTracks).values(input).onConflictDoNothing();
}

async function ensureDemoCatalog(catalogId: string, trackIds: Map<string, string>): Promise<void> {
  for (const category of CATEGORIES) {
    const categoryId = await ensureCategory(catalogId, category);
    for (const placement of category.tracks) {
      const musicTrackId = trackIds.get(placement.title);
      if (!musicTrackId) {
        throw new Error(`Morceau synthétique inconnu : ${placement.title}.`);
      }
      await ensureCatalogTrack({
        id: placement.id,
        catalogId,
        categoryId,
        musicTrackId,
        displayOrder: placement.displayOrder,
      });
    }
  }
}

export async function seedSyntheticDemo(): Promise<void> {
  assertEachTrackOnce();
  const trackIds = await ensureLibrary();
  const userId = await ensureDemoUser();
  // Ne remplace pas un catalogue existant et ne touche pas à `revision`.
  const catalog = await ensureCatalogForUser(userId);
  await ensureDemoCatalog(catalog.id, trackIds);
}
