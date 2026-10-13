import { eq } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db/client.server";
import { musicTracks } from "@/db/schema";
import { searchLocalTracks } from "@/features/music/search.server";

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

async function insertTrack(title: string, artist: string, albumTitle: string | null = null) {
  const [track] = await db
    .insert(musicTracks)
    .values({ title, artist, albumTitle })
    .returning({ id: musicTracks.id });
  if (!track) {
    throw new Error("Morceau absent.");
  }
  return track.id;
}

test("classe exact, préfixe puis contenu, y compris sur deux champs", async () => {
  await insertTrack("queen", "Someone");
  await insertTrack("Bohemian Rhapsody", "Queen", "A Night at the Opera");
  await insertTrack("Queenie", "Band");
  await insertTrack("Night", "The Queens");

  const exact = await searchLocalTracks("QUEEN");
  expect(exact.ok).toBe(true);
  if (!exact.ok) {
    return;
  }
  expect(exact.data.results.map((track) => track.title)).toEqual([
    "Bohemian Rhapsody",
    "queen",
    "Queenie",
    "Night",
  ]);

  const split = await searchLocalTracks("  queen   boh ");
  expect(split.ok && split.data.results.map((track) => track.title)).toEqual(["Bohemian Rhapsody"]);

  const prefix = await searchLocalTracks("bohemian");
  expect(prefix.ok && prefix.data.results.map((track) => track.title)).toEqual([
    "Bohemian Rhapsody",
  ]);

  const fuzzy = await searchLocalTracks("qeen");
  expect(fuzzy.ok && fuzzy.data.results).toEqual([]);
});

test("borne la recherche à 20 résultats", async () => {
  for (let index = 0; index < 25; index += 1) {
    await insertTrack(`Morceau ${index.toString().padStart(2, "0")}`, "Marqueurzzzz");
  }

  const result = await searchLocalTracks("marqueurzzzz");
  expect(result.ok && result.data.results).toHaveLength(20);
});

test("une recherche trop courte ne lit pas comme une erreur", async () => {
  await insertTrack("Queen", "Queen");
  const result = await searchLocalTracks("q");
  expect(result).toEqual({ ok: true, data: { results: [] } });
  expect(
    await db.select({ id: musicTracks.id }).from(musicTracks).where(eq(musicTracks.title, "Queen")),
  ).toHaveLength(1);
});
