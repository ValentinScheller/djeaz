import "server-only";

import { fakeCoverArtClient, fakeMusicProvider } from "./fake-provider";
import { getCoverArtArchiveClient } from "./cover-art.server";
import { getMusicBrainzProvider } from "./musicbrainz.server";
import type { CoverArtClient, MusicMetadataProvider } from "./types";

/** Réservé aux tests et à Playwright. Ignoré quand Node tourne en production. */
export function musicProviderIsFake(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MUSIC_PROVIDER === "fake";
}

export function getMusicMetadataProvider(): MusicMetadataProvider {
  return musicProviderIsFake() ? fakeMusicProvider : getMusicBrainzProvider();
}

export function getCoverArtClient(): CoverArtClient {
  return musicProviderIsFake() ? fakeCoverArtClient : getCoverArtArchiveClient();
}
