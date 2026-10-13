import { EXTERNAL_SEARCH_LIMIT, MUSICBRAINZ_PROVIDER, MUSIC_TEXT_MAX_LENGTH } from "./limits";
import { clipMusicText } from "./text";
import type { ExternalRecording } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const LUCENE_SPECIAL = /[+\-&|!(){}[\]^"~*?:\\/]/g;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;

type ArtistCredit = {
  name?: unknown;
  joinphrase?: unknown;
  artist?: { name?: unknown };
};

type ReleaseJson = {
  id?: unknown;
  title?: unknown;
  status?: unknown;
  date?: unknown;
};

type RecordingJson = {
  id?: unknown;
  title?: unknown;
  length?: unknown;
  disambiguation?: unknown;
  "artist-credit"?: unknown;
  releases?: unknown;
  isrcs?: unknown;
};

export function isRecordingMbid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function escapeLucene(value: string): string {
  return value.replace(LUCENE_SPECIAL, "\\$&");
}

export function musicBrainzSearchUrl(query: string, limit = EXTERNAL_SEARCH_LIMIT): URL {
  const url = new URL("https://musicbrainz.org/ws/2/recording");
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("query", escapeLucene(query));
  return url;
}

export function musicBrainzLookupUrl(recordingId: string): URL {
  const url = new URL(`https://musicbrainz.org/ws/2/recording/${encodeURIComponent(recordingId)}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", "artists+releases+isrcs");
  return url;
}

export function musicBrainzTagSearchUrl(tag: string, limit: number): URL {
  const url = new URL("https://musicbrainz.org/ws/2/recording");
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("query", `tag:"${escapeLucene(tag)}"`);
  return url;
}

function textOrNull(value: unknown, max = MUSIC_TEXT_MAX_LENGTH): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const clipped = clipMusicText(value);
  return clipped.length > 0 ? clipped.slice(0, max) : null;
}

function artistFromCredits(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  let artist = "";
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const credit = entry as ArtistCredit;
    const name = textOrNull(credit.name) ?? textOrNull(credit.artist?.name);
    if (!name) {
      continue;
    }
    artist += name;
    if (typeof credit.joinphrase === "string") {
      artist += credit.joinphrase;
    }
  }

  const clipped = clipMusicText(artist);
  return clipped.length > 0 ? clipped.slice(0, MUSIC_TEXT_MAX_LENGTH) : null;
}

function durationOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  if (value <= 0 || value > MAX_DURATION_MS) {
    return null;
  }
  return value;
}

function isrcOrNull(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }
  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const isrc = entry.trim().toUpperCase();
    if (ISRC_PATTERN.test(isrc)) {
      return isrc;
    }
  }
  return null;
}

function representativeRelease(value: unknown): { id: string; title: string | null } | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const releases = value.filter((entry): entry is ReleaseJson => {
    return (
      typeof entry === "object" && entry !== null && typeof (entry as ReleaseJson).id === "string"
    );
  });

  const official = releases.filter((release) => {
    return typeof release.status === "string" && release.status.toLowerCase() === "official";
  });
  const pool = official.length > 0 ? official : releases;
  const dated = pool.filter(
    (release) => typeof release.date === "string" && release.date.length > 0,
  );
  const chosen = (dated.length > 0 ? dated : pool).slice().sort((left, right) => {
    const leftDate = typeof left.date === "string" ? left.date : "";
    const rightDate = typeof right.date === "string" ? right.date : "";
    return leftDate.localeCompare(rightDate);
  })[0];

  if (!chosen || typeof chosen.id !== "string" || !isRecordingMbid(chosen.id)) {
    return null;
  }

  return { id: chosen.id, title: textOrNull(chosen.title) };
}

export function parseMusicBrainzRecording(value: unknown): ExternalRecording | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const recording = value as RecordingJson;
  if (typeof recording.id !== "string" || !isRecordingMbid(recording.id)) {
    return null;
  }

  const title = textOrNull(recording.title);
  const artist = artistFromCredits(recording["artist-credit"]);
  if (!title || !artist) {
    return null;
  }

  const release = representativeRelease(recording.releases);

  return {
    provider: MUSICBRAINZ_PROVIDER,
    externalId: recording.id,
    title,
    artist,
    albumTitle: release?.title ?? null,
    releaseId: release?.id ?? null,
    durationMs: durationOrNull(recording.length),
    isrc: isrcOrNull(recording.isrcs),
    disambiguation: textOrNull(recording.disambiguation),
  };
}

export function parseMusicBrainzSearch(value: unknown): ExternalRecording[] {
  if (typeof value !== "object" || value === null || !("recordings" in value)) {
    return [];
  }

  const recordings = value.recordings;
  if (!Array.isArray(recordings)) {
    return [];
  }

  return recordings.flatMap((entry) => {
    const parsed = parseMusicBrainzRecording(entry);
    return parsed ? [parsed] : [];
  });
}
