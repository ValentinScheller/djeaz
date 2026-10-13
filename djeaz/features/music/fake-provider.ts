import { matchesLocalQuery } from "./text";
import type { CoverArtClient, ExternalRecording, MusicMetadataProvider } from "./types";

/** Enregistrement fixe pour les tests et le serveur e2e. Jamais utilisé en production. */
export const FAKE_WIDE_RECORDING: ExternalRecording = {
  provider: "musicbrainz",
  externalId: "11111111-1111-4111-8111-111111111111",
  title: "Morceau élargi",
  artist: "Artiste Lointain",
  albumTitle: "Album Lointain",
  releaseId: "22222222-2222-4222-8222-222222222222",
  durationMs: 180_000,
  isrc: null,
  disambiguation: "version test",
};

export const fakeMusicProvider: MusicMetadataProvider = {
  async searchRecordings(query) {
    return matchesLocalQuery(FAKE_WIDE_RECORDING, query) ? [FAKE_WIDE_RECORDING] : [];
  },

  async getRecording(recordingId) {
    return recordingId === FAKE_WIDE_RECORDING.externalId ? FAKE_WIDE_RECORDING : null;
  },

  async searchRecordingsByTag() {
    return [];
  },
};

export const fakeCoverArtClient: CoverArtClient = {
  async lookupThumbnailUrl() {
    return null;
  },
};
