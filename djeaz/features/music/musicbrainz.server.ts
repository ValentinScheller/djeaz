import "server-only";

import { EXTERNAL_SEARCH_LIMIT } from "./limits";
import { fetchProviderJson } from "./http.server";
import {
  isRecordingMbid,
  musicBrainzLookupUrl,
  musicBrainzSearchUrl,
  musicBrainzTagSearchUrl,
  parseMusicBrainzRecording,
  parseMusicBrainzSearch,
} from "./musicbrainz-parse";
import { scheduleProviderCall } from "./schedule.server";
import type { MusicMetadataProvider } from "./types";
import { readMusicBrainzUserAgent } from "./user-agent";

const TAG_PATTERN = /^[a-z0-9][a-z0-9 -]{0,39}$/i;

type MusicBrainzDeps = {
  fetch?: typeof fetch;
  userAgent?: string;
  schedule?: <T>(task: () => Promise<T>) => Promise<T>;
  timeoutMs?: number;
};

export function createMusicBrainzProvider(deps: MusicBrainzDeps = {}): MusicMetadataProvider {
  const schedule = deps.schedule ?? scheduleProviderCall;

  function userAgent(): string {
    return deps.userAgent ?? readMusicBrainzUserAgent();
  }

  async function readJson(url: URL): Promise<unknown> {
    return schedule(() =>
      fetchProviderJson(url, userAgent(), {
        fetch: deps.fetch,
        timeoutMs: deps.timeoutMs,
      }),
    );
  }

  return {
    async searchRecordings(query) {
      const payload = await readJson(musicBrainzSearchUrl(query, EXTERNAL_SEARCH_LIMIT));
      if (payload === null) {
        return [];
      }
      return parseMusicBrainzSearch(payload).slice(0, EXTERNAL_SEARCH_LIMIT);
    },

    async getRecording(recordingId) {
      if (!isRecordingMbid(recordingId)) {
        return null;
      }
      const payload = await readJson(musicBrainzLookupUrl(recordingId));
      if (payload === null) {
        return null;
      }
      return parseMusicBrainzRecording(payload);
    },

    async searchRecordingsByTag(tag, limit) {
      const normalized = tag.trim();
      if (!TAG_PATTERN.test(normalized)) {
        return [];
      }
      const bounded = Math.min(Math.max(limit, 1), EXTERNAL_SEARCH_LIMIT);
      const payload = await readJson(musicBrainzTagSearchUrl(normalized, bounded));
      if (payload === null) {
        return [];
      }
      return parseMusicBrainzSearch(payload).slice(0, bounded);
    },
  };
}

let musicBrainzProvider: MusicMetadataProvider | undefined;

export function getMusicBrainzProvider(): MusicMetadataProvider {
  musicBrainzProvider ??= createMusicBrainzProvider();
  return musicBrainzProvider;
}
