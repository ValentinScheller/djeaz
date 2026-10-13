import "server-only";

import { fetchProviderJson } from "./http.server";
import {
  listenBrainzArtistRecordingsUrl,
  listenBrainzArtistsUrl,
  listenBrainzRecordingsUrl,
  parseListenBrainzArtistRecordings,
  parseListenBrainzArtists,
  parseListenBrainzRecordings,
  type PopularArtist,
  type PopularRecording,
} from "./listenbrainz-parse";
import { isRecordingMbid } from "./musicbrainz-parse";
import { scheduleProviderCall } from "./schedule.server";
import { readMusicBrainzUserAgent } from "./user-agent";

const SITEWIDE_MAX = 100;

export type ListenBrainzPopularity = {
  listPopularArtists(count: number, offset: number): Promise<PopularArtist[]>;
  listPopularRecordingsForArtist(artistMbid: string, limit: number): Promise<PopularRecording[]>;
  listGlobalRecordings(count: number, offset: number): Promise<PopularRecording[]>;
};

function clampCount(count: number): number {
  return Math.min(Math.max(Math.trunc(count), 1), SITEWIDE_MAX);
}

export function createListenBrainzPopularity(deps?: {
  fetch?: typeof fetch;
  userAgent?: string;
  schedule?: <T>(task: () => Promise<T>) => Promise<T>;
  timeoutMs?: number;
}): ListenBrainzPopularity {
  const schedule = deps?.schedule ?? scheduleProviderCall;

  async function readJson(url: URL): Promise<unknown> {
    const payload = await schedule(() =>
      fetchProviderJson(url, deps?.userAgent ?? readMusicBrainzUserAgent(), {
        fetch: deps?.fetch,
        timeoutMs: deps?.timeoutMs,
      }),
    );
    if (payload === null) {
      return { payload: {} };
    }
    return payload;
  }

  return {
    async listPopularArtists(count, offset) {
      const payload = await readJson(
        listenBrainzArtistsUrl(clampCount(count), Math.max(offset, 0)),
      );
      return parseListenBrainzArtists(payload).slice(0, clampCount(count));
    },

    async listPopularRecordingsForArtist(artistMbid, limit) {
      if (!isRecordingMbid(artistMbid)) {
        return [];
      }
      const payload = await readJson(listenBrainzArtistRecordingsUrl(artistMbid));
      return parseListenBrainzArtistRecordings(payload).slice(0, clampCount(limit));
    },

    async listGlobalRecordings(count, offset) {
      const payload = await readJson(
        listenBrainzRecordingsUrl(clampCount(count), Math.max(offset, 0)),
      );
      return parseListenBrainzRecordings(payload).slice(0, clampCount(count));
    },
  };
}
