import type { MUSICBRAINZ_PROVIDER } from "./limits";

export type LocalTrackHit = {
  id: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  artworkUrl: string | null;
};

export type ExternalCandidate = {
  externalId: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  durationMs: number | null;
  isrc: string | null;
  disambiguation: string | null;
};

export type ExternalRecording = {
  provider: typeof MUSICBRAINZ_PROVIDER;
  externalId: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  releaseId: string | null;
  durationMs: number | null;
  isrc: string | null;
  disambiguation: string | null;
};

export type MusicMetadataProvider = {
  searchRecordings(query: string): Promise<ExternalRecording[]>;
  getRecording(recordingId: string): Promise<ExternalRecording | null>;
  searchRecordingsByTag?(tag: string, limit: number): Promise<ExternalRecording[]>;
};

export type CoverArtClient = {
  lookupThumbnailUrl(releaseId: string): Promise<string | null>;
};

export class MusicProviderError extends Error {
  readonly status: number | null;

  constructor(status: number | null) {
    super("Fournisseur musical indisponible.");
    this.name = "MusicProviderError";
    this.status = status;
  }
}
