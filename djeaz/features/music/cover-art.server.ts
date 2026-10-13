import "server-only";

import { readCoverArtThumbnailUrl, coverArtReleaseUrl } from "./cover-art";
import { fetchProviderJson } from "./http.server";
import { isRecordingMbid } from "./musicbrainz-parse";
import { scheduleProviderCall } from "./schedule.server";
import type { CoverArtClient } from "./types";
import { readMusicBrainzUserAgent } from "./user-agent";

type CoverArtDeps = {
  fetch?: typeof fetch;
  userAgent?: string;
  schedule?: <T>(task: () => Promise<T>) => Promise<T>;
  timeoutMs?: number;
};

export function createCoverArtClient(deps: CoverArtDeps = {}): CoverArtClient {
  const schedule = deps.schedule ?? scheduleProviderCall;

  return {
    async lookupThumbnailUrl(releaseId) {
      if (!isRecordingMbid(releaseId)) {
        return null;
      }
      const payload = await schedule(() =>
        fetchProviderJson(
          coverArtReleaseUrl(releaseId),
          deps.userAgent ?? readMusicBrainzUserAgent(),
          {
            fetch: deps.fetch,
            timeoutMs: deps.timeoutMs,
          },
        ),
      );
      if (payload === null) {
        return null;
      }
      return readCoverArtThumbnailUrl(payload, releaseId);
    },
  };
}

let coverArtClient: CoverArtClient | undefined;

export function getCoverArtArchiveClient(): CoverArtClient {
  coverArtClient ??= createCoverArtClient();
  return coverArtClient;
}
