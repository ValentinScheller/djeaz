import { expect, test } from "vitest";

import { decideDedupe, metadataFill, textLockKey, type KnownTrack } from "./dedupe";
import type { ExternalRecording } from "./types";

function track(overrides: Partial<KnownTrack> = {}): KnownTrack {
  return {
    id: "track-1",
    title: "Song",
    artist: "Artist",
    albumTitle: "Album",
    disambiguation: null,
    artworkUrl: "https://coverartarchive.org/release/existing/front-250",
    artworkProvider: "cover-art-archive",
    isrc: null,
    durationMs: 180_000,
    sources: [],
    ...overrides,
  };
}

function recording(overrides: Partial<ExternalRecording> = {}): ExternalRecording {
  return {
    provider: "musicbrainz",
    externalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Song",
    artist: "Artist",
    albumTitle: "Autre album",
    releaseId: null,
    durationMs: 180_000,
    isrc: null,
    disambiguation: null,
    ...overrides,
  };
}

test("réutilise d'abord le couple fournisseur et identifiant", () => {
  const existing = track({
    title: "Autre titre",
    sources: [{ provider: "musicbrainz", externalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
  });

  expect(decideDedupe(recording(), [existing])).toEqual({
    action: "reuse",
    trackId: "track-1",
    level: "provider",
  });
});

test("réutilise un ISRC exact unique et refuse un ISRC ambigu", () => {
  const incoming = recording({
    externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    isrc: "GBUM71029604",
    title: "Titre différent",
  });

  expect(decideDedupe(incoming, [track({ isrc: "GBUM71029604" })])).toEqual({
    action: "reuse",
    trackId: "track-1",
    level: "isrc",
  });

  expect(
    decideDedupe(incoming, [
      track({ id: "a", isrc: "GBUM71029604" }),
      track({ id: "b", isrc: "GBUM71029604" }),
    ]),
  ).toEqual({ action: "insert" });
});

test("rapproche un titre identique sans marqueur et refuse une variante ambiguë", () => {
  expect(
    decideDedupe(recording({ externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }), [track()]),
  ).toEqual({
    action: "reuse",
    trackId: "track-1",
    level: "text",
  });

  expect(
    decideDedupe(
      recording({
        externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        disambiguation: "live",
      }),
      [track()],
    ),
  ).toEqual({ action: "insert" });

  expect(
    decideDedupe(
      recording({ externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Song (Remix)" }),
      [track()],
    ),
  ).toEqual({ action: "insert" });
});

test("ne fusionne pas une variante déjà enregistrée, même hors du titre", () => {
  const incoming = recording({ externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });

  expect(decideDedupe(incoming, [track({ disambiguation: "live" })])).toEqual({
    action: "insert",
  });
  expect(decideDedupe(incoming, [track({ albumTitle: "Live in Paris" })])).toEqual({
    action: "insert",
  });
  expect(
    decideDedupe(
      recording({
        externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        albumTitle: "September (Remastered)",
      }),
      [track()],
    ),
  ).toEqual({ action: "insert" });
});

test("verrouille le texte sans la durée exacte, et pas une variante", () => {
  const clean = recording({ durationMs: 180_000 });
  const near = recording({
    externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    durationMs: 181_500,
  });
  expect(textLockKey(clean)).toBe(textLockKey(near));
  expect(textLockKey(recording({ disambiguation: "live" }))).toBeNull();
  expect(textLockKey(recording({ durationMs: null }))).toBeNull();
});

test("ne fusionne pas quand deux morceaux portent le même texte", () => {
  expect(
    decideDedupe(recording({ externalId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }), [
      track({ id: "a" }),
      track({ id: "b" }),
    ]),
  ).toEqual({ action: "insert" });
});

test("ne remplace pas des métadonnées déjà présentes", () => {
  expect(
    metadataFill(track(), {
      albumTitle: "Nouveau",
      disambiguation: "live",
      artworkUrl: "https://coverartarchive.org/release/new/front-250",
      artworkProvider: "cover-art-archive",
      isrc: "GBUM71029604",
      durationMs: 200_000,
    }),
  ).toEqual({ disambiguation: "live", isrc: "GBUM71029604" });

  expect(
    metadataFill(
      track({
        albumTitle: null,
        disambiguation: "single",
        artworkUrl: null,
        artworkProvider: null,
        durationMs: null,
      }),
      {
        albumTitle: "Nouveau",
        disambiguation: "autre",
        artworkUrl: "https://coverartarchive.org/release/new/front-250",
        artworkProvider: "cover-art-archive",
        isrc: null,
        durationMs: 200_000,
      },
    ),
  ).toEqual({
    albumTitle: "Nouveau",
    artworkUrl: "https://coverartarchive.org/release/new/front-250",
    artworkProvider: "cover-art-archive",
    durationMs: 200_000,
  });
});
