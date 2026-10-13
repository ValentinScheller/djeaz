import type { ExternalRecording } from "./types";
import type { ImportCheckpoint } from "./checkpoint";
import { buildImportCandidates } from "./import-plan";
import type { PopularArtist, PopularRecording } from "./listenbrainz-parse";
import type { CoverArtClient, MusicMetadataProvider } from "./types";

export type PopularitySource = {
  listPopularArtists(count: number, offset: number): Promise<PopularArtist[]>;
  listPopularRecordingsForArtist(artistMbid: string, limit: number): Promise<PopularRecording[]>;
  listGlobalRecordings(count: number, offset: number): Promise<PopularRecording[]>;
};

export type ImportRunResult = {
  imported: number;
  skipped: number;
  failed: number;
};

export async function runMusicImport(input: {
  limit: number;
  artists: number;
  perArtist: number;
  global: number;
  balanceTags: string[];
  balancePerTag: number;
  popularity: PopularitySource;
  music: MusicMetadataProvider;
  coverArt: CoverArtClient;
  persist: (recording: ExternalRecording, artworkUrl: string | null) => Promise<void>;
  checkpoint: ImportCheckpoint;
}): Promise<ImportRunResult> {
  const done = await input.checkpoint.load();
  const artistSlices: { artistMbid: string; recordingMbids: string[] }[] = [];
  let failed = 0;

  let artists: PopularArtist[] = [];
  try {
    artists = await input.popularity.listPopularArtists(input.artists, 0);
  } catch {
    failed += 1;
  }

  for (const artist of artists) {
    try {
      const recordings = await input.popularity.listPopularRecordingsForArtist(
        artist.artistMbid,
        input.perArtist,
      );
      artistSlices.push({
        artistMbid: artist.artistMbid,
        recordingMbids: recordings.map((recording) => recording.recordingMbid),
      });
    } catch {
      failed += 1;
    }
  }

  let globalRecordingMbids: string[] = [];
  try {
    const globalRecordings = await input.popularity.listGlobalRecordings(input.global, 0);
    globalRecordingMbids = globalRecordings.map((recording) => recording.recordingMbid);
  } catch {
    failed += 1;
  }

  const balanceRecordingMbids: string[] = [];
  if (input.balanceTags.length > 0 && input.music.searchRecordingsByTag) {
    for (const tag of input.balanceTags) {
      try {
        const found = await input.music.searchRecordingsByTag(tag, input.balancePerTag);
        balanceRecordingMbids.push(...found.map((recording) => recording.externalId));
      } catch {
        failed += 1;
      }
    }
  }

  const collected = buildImportCandidates({
    artists: artistSlices,
    globalRecordingMbids,
    balanceRecordingMbids,
    limit: Number.MAX_SAFE_INTEGER,
    alreadyDone: new Set(),
  });
  const skipped = collected.filter((candidate) => done.has(candidate.recordingMbid)).length;
  const candidates = buildImportCandidates({
    artists: artistSlices,
    globalRecordingMbids,
    balanceRecordingMbids,
    limit: input.limit,
    alreadyDone: done,
  });

  let imported = 0;
  // Un recording en échec n'est pas checkpointé : il sera réessayé et occupera
  // à nouveau une place dans la limite. Le reste du lot continue.
  for (const candidate of candidates) {
    try {
      const recording = await input.music.getRecording(candidate.recordingMbid);
      if (!recording) {
        failed += 1;
        continue;
      }

      let artworkUrl: string | null = null;
      if (recording.releaseId) {
        try {
          artworkUrl = await input.coverArt.lookupThumbnailUrl(recording.releaseId);
        } catch {
          artworkUrl = null;
        }
      }

      await input.persist(recording, artworkUrl);
      await input.checkpoint.markDone(candidate.recordingMbid);
      imported += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, skipped, failed };
}
