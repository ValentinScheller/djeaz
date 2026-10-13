import { DURATION_MATCH_TOLERANCE_MS, MUSICBRAINZ_PROVIDER } from "./limits";
import { hasVariantMarker, normalizeMusicText } from "./text";
import type { ExternalRecording } from "./types";

export type KnownTrack = {
  id: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  disambiguation: string | null;
  artworkUrl: string | null;
  artworkProvider: string | null;
  isrc: string | null;
  durationMs: number | null;
  sources: { provider: string; externalId: string }[];
};

export type DedupeDecision =
  | { action: "reuse"; trackId: string; level: "provider" | "recording" | "isrc" | "text" }
  | { action: "insert" };

export type MetadataFill = {
  albumTitle?: string;
  disambiguation?: string;
  artworkUrl?: string;
  artworkProvider?: string;
  isrc?: string;
  durationMs?: number;
};

function hasSideVariant(
  title: string,
  disambiguation: string | null,
  albumTitle: string | null,
): boolean {
  return hasVariantMarker(title, disambiguation) || hasVariantMarker(albumTitle ?? "", null);
}

function sourceMatch(
  tracks: KnownTrack[],
  provider: string,
  externalId: string,
): KnownTrack | undefined {
  return tracks.find((track) =>
    track.sources.some(
      (source) => source.provider === provider && source.externalId === externalId,
    ),
  );
}

export function textMergeEligible(recording: ExternalRecording): boolean {
  return (
    recording.durationMs !== null &&
    !hasSideVariant(recording.title, recording.disambiguation, recording.albumTitle)
  );
}

/**
 * Même clé pour deux durées dans la tolérance : le verrou ne peut pas inclure
 * la durée exacte, sinon deux sélections simultanées échappent au rapprochement.
 */
export function textLockKey(recording: ExternalRecording): string | null {
  if (!textMergeEligible(recording)) {
    return null;
  }

  return `text:${normalizeMusicText(recording.artist)}|${normalizeMusicText(recording.title)}`;
}

export function decideDedupe(recording: ExternalRecording, tracks: KnownTrack[]): DedupeDecision {
  const byProvider = sourceMatch(tracks, recording.provider, recording.externalId);
  if (byProvider) {
    return { action: "reuse", trackId: byProvider.id, level: "provider" };
  }

  const byRecording = sourceMatch(tracks, MUSICBRAINZ_PROVIDER, recording.externalId);
  if (byRecording) {
    return { action: "reuse", trackId: byRecording.id, level: "recording" };
  }

  if (recording.isrc) {
    const byIsrc = tracks.filter((track) => track.isrc === recording.isrc);
    if (byIsrc.length === 1 && byIsrc[0]) {
      return { action: "reuse", trackId: byIsrc[0].id, level: "isrc" };
    }
    if (byIsrc.length > 1) {
      return { action: "insert" };
    }
  }

  if (!textMergeEligible(recording) || recording.durationMs === null) {
    return { action: "insert" };
  }

  const title = normalizeMusicText(recording.title);
  const artist = normalizeMusicText(recording.artist);
  const byText = tracks.filter((track) => {
    if (hasSideVariant(track.title, track.disambiguation, track.albumTitle)) {
      return false;
    }
    if (normalizeMusicText(track.title) !== title || normalizeMusicText(track.artist) !== artist) {
      return false;
    }
    if (track.durationMs === null) {
      return false;
    }
    return Math.abs(track.durationMs - recording.durationMs!) <= DURATION_MATCH_TOLERANCE_MS;
  });

  if (byText.length === 1 && byText[0]) {
    return { action: "reuse", trackId: byText[0].id, level: "text" };
  }

  return { action: "insert" };
}

/** Ne remplit que les trous. Un titre, un artiste ou une pochette déjà présents restent. */
export function metadataFill(
  existing: Pick<
    KnownTrack,
    "albumTitle" | "disambiguation" | "artworkUrl" | "isrc" | "durationMs"
  >,
  incoming: {
    albumTitle: string | null;
    disambiguation: string | null;
    artworkUrl: string | null;
    artworkProvider: string | null;
    isrc: string | null;
    durationMs: number | null;
  },
): MetadataFill | null {
  const patch: MetadataFill = {};

  if (!existing.albumTitle && incoming.albumTitle) {
    patch.albumTitle = incoming.albumTitle;
  }
  if (!existing.disambiguation && incoming.disambiguation) {
    patch.disambiguation = incoming.disambiguation;
  }
  if (!existing.artworkUrl && incoming.artworkUrl && incoming.artworkProvider) {
    patch.artworkUrl = incoming.artworkUrl;
    patch.artworkProvider = incoming.artworkProvider;
  }
  if (!existing.isrc && incoming.isrc) {
    patch.isrc = incoming.isrc;
  }
  if (existing.durationMs === null && incoming.durationMs !== null) {
    patch.durationMs = incoming.durationMs;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
