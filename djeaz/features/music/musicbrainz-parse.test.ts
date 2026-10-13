import { expect, test } from "vitest";

import {
  escapeLucene,
  musicBrainzLookupUrl,
  musicBrainzSearchUrl,
  parseMusicBrainzRecording,
  parseMusicBrainzSearch,
} from "./musicbrainz-parse";

const RECORDING = {
  id: "b1a9c53e-9c4a-4c55-8f0a-1d2e3f4a5b6c",
  title: "Bohemian Rhapsody",
  length: 355000,
  disambiguation: "single",
  "artist-credit": [
    { name: "Queen", joinphrase: " & " },
    { name: "David Bowie", artist: { name: "David Bowie" }, joinphrase: "" },
  ],
  releases: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Bootleg",
      status: "Bootleg",
      date: "1975",
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      title: "A Night at the Opera",
      status: "Official",
      date: "1975-11-21",
    },
  ],
  isrcs: ["not-an-isrc", "gbum71029604"],
};

test("construit les URL MusicBrainz sans donnée de session", () => {
  const search = musicBrainzSearchUrl("queen boh");
  expect(search.origin).toBe("https://musicbrainz.org");
  expect(search.pathname).toBe("/ws/2/recording");
  expect(search.searchParams.get("fmt")).toBe("json");
  expect(search.searchParams.get("limit")).toBe("10");
  expect(search.searchParams.get("query")).toBe("queen boh");

  const lookup = musicBrainzLookupUrl("b1a9c53e-9c4a-4c55-8f0a-1d2e3f4a5b6c");
  expect(lookup.pathname).toBe("/ws/2/recording/b1a9c53e-9c4a-4c55-8f0a-1d2e3f4a5b6c");
  expect(lookup.searchParams.get("inc")).toBe("artists+releases+isrcs");
  expect(escapeLucene('a+b"c')).toBe('a\\+b\\"c');
});

test("normalise un recording et choisit la release officielle", () => {
  expect(parseMusicBrainzRecording(RECORDING)).toEqual({
    provider: "musicbrainz",
    externalId: "b1a9c53e-9c4a-4c55-8f0a-1d2e3f4a5b6c",
    title: "Bohemian Rhapsody",
    artist: "Queen & David Bowie",
    albumTitle: "A Night at the Opera",
    releaseId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    durationMs: 355000,
    isrc: "GBUM71029604",
    disambiguation: "single",
  });
});

test("ignore un recording sans titre ou sans artiste et lit une recherche", () => {
  expect(parseMusicBrainzRecording({ id: RECORDING.id, title: "Song" })).toBeNull();
  expect(parseMusicBrainzSearch({ recordings: [RECORDING, { id: "nope" }] })).toHaveLength(1);
  expect(parseMusicBrainzSearch({ unexpected: true })).toEqual([]);
});
