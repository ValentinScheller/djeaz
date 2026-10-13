import { expect, test } from "vitest";

import { buildImportCandidates } from "./import-plan";

test("place les morceaux d'artistes avant le complément global, sans quota par genre", () => {
  const candidates = buildImportCandidates({
    artists: [
      { artistMbid: "a", recordingMbids: ["rec-a", "rec-shared"] },
      { artistMbid: "b", recordingMbids: ["rec-b"] },
    ],
    globalRecordingMbids: ["rec-shared", "rec-global"],
    balanceRecordingMbids: ["rec-global", "rec-balance"],
    limit: 10,
    alreadyDone: new Set(["rec-b"]),
  });

  expect(candidates.map((candidate) => candidate.recordingMbid)).toEqual([
    "rec-a",
    "rec-shared",
    "rec-global",
    "rec-balance",
  ]);
  expect(candidates.map((candidate) => candidate.source)).toEqual([
    "artist",
    "artist",
    "global",
    "balance",
  ]);
});

test("respecte la limite sans compter les morceaux déjà traités", () => {
  const candidates = buildImportCandidates({
    artists: [{ artistMbid: "a", recordingMbids: ["done", "next"] }],
    globalRecordingMbids: ["later"],
    balanceRecordingMbids: [],
    limit: 1,
    alreadyDone: new Set(["done"]),
  });

  expect(candidates.map((candidate) => candidate.recordingMbid)).toEqual(["next"]);
});
