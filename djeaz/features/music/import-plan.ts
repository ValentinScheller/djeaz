import type { ExternalRecording } from "./types";

export type ImportCandidate = {
  recordingMbid: string;
  source: "artist" | "global" | "balance";
};

type ArtistSlice = {
  artistMbid: string;
  recordingMbids: string[];
};

export function buildImportCandidates(input: {
  artists: ArtistSlice[];
  globalRecordingMbids: string[];
  balanceRecordingMbids: string[];
  limit: number;
  alreadyDone: ReadonlySet<string>;
}): ImportCandidate[] {
  const seen = new Set<string>(input.alreadyDone);
  const candidates: ImportCandidate[] = [];

  const push = (recordingMbid: string, source: ImportCandidate["source"]) => {
    if (candidates.length >= input.limit || seen.has(recordingMbid)) {
      return;
    }
    seen.add(recordingMbid);
    candidates.push({ recordingMbid, source });
  };

  for (const artist of input.artists) {
    for (const recordingMbid of artist.recordingMbids) {
      push(recordingMbid, "artist");
    }
  }

  for (const recordingMbid of input.globalRecordingMbids) {
    push(recordingMbid, "global");
  }

  for (const recordingMbid of input.balanceRecordingMbids) {
    push(recordingMbid, "balance");
  }

  return candidates;
}

export function recordingFromParts(
  recording: Pick<ExternalRecording, "externalId" | "title" | "artist"> &
    Partial<ExternalRecording>,
): ExternalRecording {
  return {
    provider: "musicbrainz",
    externalId: recording.externalId,
    title: recording.title,
    artist: recording.artist,
    albumTitle: recording.albumTitle ?? null,
    releaseId: recording.releaseId ?? null,
    durationMs: recording.durationMs ?? null,
    isrc: recording.isrc ?? null,
    disambiguation: recording.disambiguation ?? null,
  };
}
