import { expect, test, vi } from "vitest";

import { runMusicImport } from "./import-run";
import type { ExternalRecording } from "./types";

function recording(externalId: string): ExternalRecording {
  return {
    provider: "musicbrainz",
    externalId,
    title: `Titre ${externalId}`,
    artist: "Artiste",
    albumTitle: null,
    releaseId: externalId.endsWith("1") ? "22222222-2222-4222-8222-222222222222" : null,
    durationMs: 180_000,
    isrc: null,
    disambiguation: null,
  };
}

test("importe dans l'ordre, rejoue sans doublon et n'appelle pas le réseau", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const persisted: string[] = [];
  const done = new Set<string>();
  const resolved: string[] = [];

  const input = {
    limit: 10,
    artists: 2,
    perArtist: 2,
    global: 2,
    balanceTags: ["rock"],
    balancePerTag: 1,
    popularity: {
      async listPopularArtists() {
        return [{ artistMbid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Queen" }];
      },
      async listPopularRecordingsForArtist() {
        return [{ recordingMbid: "11111111-1111-4111-8111-111111111111" }];
      },
      async listGlobalRecordings() {
        return [
          { recordingMbid: "11111111-1111-4111-8111-111111111111" },
          { recordingMbid: "33333333-3333-4333-8333-333333333333" },
        ];
      },
    },
    music: {
      async searchRecordings() {
        return [];
      },
      async searchRecordingsByTag() {
        return [recording("44444444-4444-4444-8444-444444444444")];
      },
      async getRecording(recordingId: string) {
        resolved.push(recordingId);
        return recording(recordingId);
      },
    },
    coverArt: {
      async lookupThumbnailUrl() {
        return "https://coverartarchive.org/release/x/front-250";
      },
    },
    persist: async (item: ExternalRecording) => {
      persisted.push(item.externalId);
    },
    checkpoint: {
      async load() {
        return done;
      },
      async markDone(recordingMbid: string) {
        done.add(recordingMbid);
      },
    },
  };

  const first = await runMusicImport(input);
  expect(resolved).toEqual([
    "11111111-1111-4111-8111-111111111111",
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444",
  ]);
  expect(persisted).toEqual(resolved);
  expect(first).toEqual({ imported: 3, skipped: 0, failed: 0 });

  persisted.length = 0;
  resolved.length = 0;
  const second = await runMusicImport(input);
  expect(second.imported).toBe(0);
  expect(second.skipped).toBe(3);
  expect(persisted).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

test("continue après un recording impossible à résoudre", async () => {
  const persisted: string[] = [];
  const result = await runMusicImport({
    limit: 5,
    artists: 1,
    perArtist: 2,
    global: 0,
    balanceTags: [],
    balancePerTag: 0,
    popularity: {
      async listPopularArtists() {
        return [{ artistMbid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Queen" }];
      },
      async listPopularRecordingsForArtist() {
        return [
          { recordingMbid: "11111111-1111-4111-8111-111111111111" },
          { recordingMbid: "33333333-3333-4333-8333-333333333333" },
        ];
      },
      async listGlobalRecordings() {
        return [];
      },
    },
    music: {
      async searchRecordings() {
        return [];
      },
      async getRecording(recordingId: string) {
        if (recordingId.startsWith("1111")) {
          throw new Error("timeout simulé");
        }
        return recording(recordingId);
      },
    },
    coverArt: {
      async lookupThumbnailUrl() {
        throw new Error("couverture indisponible");
      },
    },
    persist: async (item: ExternalRecording) => {
      persisted.push(item.externalId);
    },
    checkpoint: {
      async load() {
        return new Set();
      },
      async markDone() {
        return undefined;
      },
    },
  });

  expect(result.failed).toBe(1);
  expect(result.imported).toBe(1);
  expect(persisted).toEqual(["33333333-3333-4333-8333-333333333333"]);
});
