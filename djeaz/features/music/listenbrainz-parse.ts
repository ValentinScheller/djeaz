const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PopularArtist = {
  artistMbid: string;
  name: string;
};

export type PopularRecording = {
  recordingMbid: string;
};

function isMbid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function listenBrainzArtistsUrl(count: number, offset: number): URL {
  const url = new URL("https://api.listenbrainz.org/1/stats/sitewide/artists");
  url.searchParams.set("range", "all_time");
  url.searchParams.set("count", String(count));
  url.searchParams.set("offset", String(offset));
  return url;
}

export function listenBrainzRecordingsUrl(count: number, offset: number): URL {
  const url = new URL("https://api.listenbrainz.org/1/stats/sitewide/recordings");
  url.searchParams.set("range", "all_time");
  url.searchParams.set("count", String(count));
  url.searchParams.set("offset", String(offset));
  return url;
}

export function listenBrainzArtistRecordingsUrl(artistMbid: string): URL {
  return new URL(
    `https://api.listenbrainz.org/1/popularity/top-recordings-for-artist/${encodeURIComponent(artistMbid)}`,
  );
}

export function parseListenBrainzArtists(value: unknown): PopularArtist[] {
  if (typeof value !== "object" || value === null || !("payload" in value)) {
    return [];
  }
  const payload = value.payload;
  if (typeof payload !== "object" || payload === null || !("artists" in payload)) {
    return [];
  }
  if (!Array.isArray(payload.artists)) {
    return [];
  }

  return payload.artists.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) {
      return [];
    }
    const artistMbid = "artist_mbid" in entry ? entry.artist_mbid : undefined;
    const name = "artist_name" in entry ? entry.artist_name : undefined;
    if (!isMbid(artistMbid) || typeof name !== "string" || name.trim() === "") {
      return [];
    }
    return [{ artistMbid, name: name.trim() }];
  });
}

export function parseListenBrainzRecordings(value: unknown): PopularRecording[] {
  if (typeof value !== "object" || value === null || !("payload" in value)) {
    return [];
  }
  const payload = value.payload;
  if (typeof payload !== "object" || payload === null || !("recordings" in payload)) {
    return [];
  }
  if (!Array.isArray(payload.recordings)) {
    return [];
  }

  return recordingMbids(payload.recordings);
}

/** Réponse de `/1/popularity/top-recordings-for-artist/{mbid}` : un tableau JSON. */
export function parseListenBrainzArtistRecordings(value: unknown): PopularRecording[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return recordingMbids(value);
}

function recordingMbids(entries: unknown[]): PopularRecording[] {
  return entries.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || !("recording_mbid" in entry)) {
      return [];
    }
    const recordingMbid = entry.recording_mbid;
    if (!isMbid(recordingMbid)) {
      return [];
    }
    return [{ recordingMbid }];
  });
}
