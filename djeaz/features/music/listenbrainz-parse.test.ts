import { expect, test } from "vitest";

import {
  listenBrainzArtistRecordingsUrl,
  listenBrainzArtistsUrl,
  listenBrainzRecordingsUrl,
  parseListenBrainzArtistRecordings,
  parseListenBrainzArtists,
  parseListenBrainzRecordings,
} from "./listenbrainz-parse";

const ARTIST = "b7ffd2af-418f-4be2-bdd1-22f8b48613da";
const RECORDING = "13dd61c7-ce73-4e97-9f0c-9f0e53144411";

test("pointe les endpoints officiels de popularité et de classements", () => {
  expect(listenBrainzArtistsUrl(25, 0).pathname).toBe("/1/stats/sitewide/artists");
  expect(listenBrainzRecordingsUrl(10, 5).searchParams.get("range")).toBe("all_time");
  expect(listenBrainzArtistRecordingsUrl(ARTIST).pathname).toBe(
    `/1/popularity/top-recordings-for-artist/${ARTIST}`,
  );
});

test("ignore les lignes sans MBID", () => {
  expect(
    parseListenBrainzArtists({
      payload: {
        artists: [
          { artist_mbid: ARTIST, artist_name: "Queen", listen_count: 10 },
          { artist_mbid: null, artist_name: "Inconnu" },
        ],
      },
    }),
  ).toEqual([{ artistMbid: ARTIST, name: "Queen" }]);

  expect(
    parseListenBrainzRecordings({
      payload: {
        recordings: [
          { recording_mbid: RECORDING, recording_name: "Closer" },
          { recording_mbid: null, recording_name: "Sans identifiant" },
        ],
      },
    }),
  ).toEqual([{ recordingMbid: RECORDING }]);

  expect(
    parseListenBrainzArtistRecordings([
      { recording_mbid: RECORDING, recording_name: "Closer", total_listen_count: 3 },
      { recording_name: "Manquant" },
    ]),
  ).toEqual([{ recordingMbid: RECORDING }]);
});
