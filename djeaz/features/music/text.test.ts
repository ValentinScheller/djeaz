import { expect, test } from "vitest";

import {
  hasVariantMarker,
  localSearchRank,
  matchesLocalQuery,
  normalizeMusicText,
  parseMusicQuery,
} from "./text";

test("normalise les espaces et la casse", () => {
  expect(normalizeMusicText("  Queen   BOH ")).toBe("queen boh");
});

test("refuse une recherche trop courte, trop longue ou trop découpée", () => {
  expect(parseMusicQuery(" a ")).toEqual({ ok: false, reason: "too_short" });
  expect(parseMusicQuery("ab").ok).toBe(true);
  expect(parseMusicQuery("a".repeat(201))).toEqual({ ok: false, reason: "too_long" });
  expect(parseMusicQuery(Array.from({ length: 13 }, () => "aa").join(" "))).toEqual({
    ok: false,
    reason: "too_many_tokens",
  });
});

test("retrouve des tokens répartis entre le titre et l'artiste", () => {
  const track = { title: "Bohemian Rhapsody", artist: "Queen" };

  expect(matchesLocalQuery(track, "queen boh")).toBe(true);
  expect(matchesLocalQuery(track, "qeen")).toBe(false);
});

test("classe exact avant préfixe avant contenu", () => {
  const tracks = [
    { title: "The Queen", artist: "Other" },
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "queen", artist: "Someone" },
    { title: "Queenie", artist: "Band" },
  ];

  const ranked = tracks
    .map((track) => ({ track, rank: localSearchRank(track, "queen") }))
    .sort((left, right) => left.rank - right.rank);

  expect(ranked.map((entry) => entry.rank)).toEqual([0, 0, 1, 2]);
  expect(ranked[0]?.track.title).toBe("Bohemian Rhapsody");
  expect(ranked[1]?.track.title).toBe("queen");
  expect(localSearchRank({ title: "Bohemian Rhapsody", artist: "Queen" }, "bohemian")).toBe(1);
  expect(localSearchRank({ title: "Bohemian Rhapsody", artist: "Queen" }, "rhapsody")).toBe(2);
});

test("détecte une variante même si elle n'est que dans la désambiguïsation", () => {
  expect(hasVariantMarker("Song", "live")).toBe(true);
  expect(hasVariantMarker("Song (Radio Edit)", null)).toBe(true);
  expect(hasVariantMarker("Song", null)).toBe(false);
});
