import { eq, inArray } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db/client.server";
import { musicTracks, musicTrackSources, user } from "@/db/schema";
import { createCategoryForUser } from "@/features/catalog/mutations.server";
import { selectExternalRecording } from "@/features/catalog/external.server";
import { FAKE_WIDE_RECORDING } from "@/features/music/fake-provider";
import { persistImportedRecording } from "@/features/music/persist.server";
import { searchExternalRecordings } from "@/features/music/search.server";
import type { ExternalRecording } from "@/features/music/types";

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

function recording(overrides: Partial<ExternalRecording>): ExternalRecording {
  return {
    provider: "musicbrainz",
    externalId: crypto.randomUUID(),
    title: "Song",
    artist: "Artist",
    albumTitle: null,
    releaseId: null,
    durationMs: 180_000,
    isrc: null,
    disambiguation: null,
    ...overrides,
  };
}

async function insertUser(id: string) {
  await db.insert(user).values({
    id,
    name: "DJ",
    artistName: id,
    email: `${id}@example.com`,
  });
  const { ensureCatalogForUser } = await import("@/features/catalog/ensure-catalog.server");
  return ensureCatalogForUser(id);
}

test("deux sélections concurrentes du même recording ne créent qu'un morceau", async () => {
  const incoming = recording({ title: "Concurrent", artist: "Shared" });
  const [first, second] = await Promise.all([
    persistImportedRecording(incoming, null),
    persistImportedRecording(incoming, null),
  ]);

  expect(first).toBe(second);
  const tracks = await db.select().from(musicTracks).where(eq(musicTracks.title, "Concurrent"));
  const sources = await db
    .select()
    .from(musicTrackSources)
    .where(eq(musicTrackSources.externalId, incoming.externalId));
  expect(tracks).toHaveLength(1);
  expect(sources).toHaveLength(1);
  expect(sources[0]?.provider).toBe("musicbrainz");
});

test("réutilise un ISRC non ambigu et n'écrase pas le titre", async () => {
  const [existing] = await db
    .insert(musicTracks)
    .values({
      title: "Titre conservé",
      artist: "Artist",
      isrc: "GBUM71029604",
      durationMs: 180_000,
    })
    .returning();
  const incoming = recording({
    title: "Titre fournisseur",
    artist: "Artist",
    isrc: "GBUM71029604",
    albumTitle: "Nouvel album",
  });

  const id = await persistImportedRecording(
    incoming,
    "https://coverartarchive.org/release/new/front-250",
  );
  const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));

  expect(id).toBe(existing?.id);
  expect(track?.title).toBe("Titre conservé");
  expect(track?.albumTitle).toBe("Nouvel album");
  expect(track?.artworkUrl).toBe("https://coverartarchive.org/release/new/front-250");
  expect(track?.artworkProvider).toBe("cover-art-archive");
});

test("ne fusionne pas un ISRC ambigu ni une variante live", async () => {
  await db.insert(musicTracks).values([
    { title: "Double", artist: "Artist", isrc: "USRC17607839" },
    { title: "Double", artist: "Artist", isrc: "USRC17607839" },
  ]);
  const ambiguous = recording({ title: "Double", artist: "Artist", isrc: "USRC17607839" });
  const ambiguousId = await persistImportedRecording(ambiguous, null);
  const ambiguousRows = await db
    .select()
    .from(musicTracks)
    .where(eq(musicTracks.isrc, "USRC17607839"));
  expect(ambiguousRows).toHaveLength(3);
  expect(ambiguousRows.some((row) => row.id === ambiguousId)).toBe(true);

  const [original] = await db
    .insert(musicTracks)
    .values({ title: "Ballade", artist: "Artist", durationMs: 180_000 })
    .returning();
  const live = recording({
    title: "Ballade",
    artist: "Artist",
    durationMs: 180_000,
    disambiguation: "live",
  });
  const liveId = await persistImportedRecording(live, null);
  expect(liveId).not.toBe(original?.id);
});

test("deux recordings proches en durée fusionnent, une variante déjà stockée non", async () => {
  const left = recording({
    title: "Proche",
    artist: "Shared",
    durationMs: 180_000,
    albumTitle: "Studio",
  });
  const right = recording({
    title: "Proche",
    artist: "Shared",
    durationMs: 181_500,
    albumTitle: "Single",
  });
  const [leftId, rightId] = await Promise.all([
    persistImportedRecording(left, null),
    persistImportedRecording(right, null),
  ]);
  expect(leftId).toBe(rightId);
  const sources = await db
    .select()
    .from(musicTrackSources)
    .where(inArray(musicTrackSources.externalId, [left.externalId, right.externalId]));
  expect(sources).toHaveLength(2);
  expect(new Set(sources.map((source) => source.musicTrackId)).size).toBe(1);

  const stored = await persistImportedRecording(
    recording({
      title: "Conserve",
      artist: "Artist",
      durationMs: 200_000,
      albumTitle: "Studio",
      disambiguation: "live",
    }),
    null,
  );
  const [storedRow] = await db.select().from(musicTracks).where(eq(musicTracks.id, stored));
  expect(storedRow?.disambiguation).toBe("live");

  const later = await persistImportedRecording(
    recording({
      title: "Conserve",
      artist: "Artist",
      durationMs: 201_000,
      albumTitle: "Studio",
      disambiguation: null,
    }),
    null,
  );
  expect(later).not.toBe(stored);

  const concert = await persistImportedRecording(
    recording({
      title: "Hymne",
      artist: "Artist",
      durationMs: 210_000,
      albumTitle: "Live in Paris",
    }),
    null,
  );
  const studio = await persistImportedRecording(
    recording({
      title: "Hymne",
      artist: "Artist",
      durationMs: 211_000,
      albumTitle: "Hymne",
    }),
    null,
  );
  expect(studio).not.toBe(concert);
});

test("une recherche externe fake n'écrit rien, la sélection écrit une seule provenance", async () => {
  process.env.MUSIC_PROVIDER = "fake";
  try {
    const before = await db.select({ id: musicTracks.id }).from(musicTracks);
    const searched = await searchExternalRecordings("lointain");
    const afterSearch = await db.select({ id: musicTracks.id }).from(musicTracks);
    expect(searched.ok && searched.data.results.map((result) => result.title)).toEqual([
      "Morceau élargi",
    ]);
    expect(afterSearch).toEqual(before);

    await insertUser("dj-external");
    const category = await createCategoryForUser("dj-external", "Cocktail");
    if (!category.ok) {
      throw new Error(category.error.message);
    }

    const [left, right] = await Promise.all([
      selectExternalRecording(
        "dj-external",
        category.data.categoryId,
        FAKE_WIDE_RECORDING.externalId,
      ),
      selectExternalRecording(
        "dj-external",
        category.data.categoryId,
        FAKE_WIDE_RECORDING.externalId,
      ),
    ]);
    const successes = [left, right].filter((result) => result.ok);
    const conflicts = [left, right].filter(
      (result) => !result.ok && result.error.code === "CONFLICT",
    );
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);

    const tracks = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.title, FAKE_WIDE_RECORDING.title));
    const sources = await db
      .select()
      .from(musicTrackSources)
      .where(eq(musicTrackSources.externalId, FAKE_WIDE_RECORDING.externalId));
    expect(tracks).toHaveLength(1);
    expect(sources).toHaveLength(1);
  } finally {
    delete process.env.MUSIC_PROVIDER;
  }
});
