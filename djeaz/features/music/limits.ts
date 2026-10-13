/** Bornes partagées par la recherche locale, le repli MusicBrainz et l'import. */
export const MUSIC_QUERY_MIN_LENGTH = 2;
export const MUSIC_QUERY_MAX_LENGTH = 200;
export const MUSIC_QUERY_MAX_TOKENS = 12;
export const LOCAL_SEARCH_LIMIT = 20;
export const EXTERNAL_SEARCH_LIMIT = 10;
export const SEARCH_DEBOUNCE_MS = 300;

/** Deux durées à moins de 2 s sont le même signal, pas deux montages. */
export const DURATION_MATCH_TOLERANCE_MS = 2_000;

export const MUSICBRAINZ_PROVIDER = "musicbrainz" as const;
export const COVER_ART_PROVIDER = "cover-art-archive" as const;

/** Limite officielle MusicBrainz : environ 1 requête par seconde. */
export const PROVIDER_MIN_INTERVAL_MS = 1_100;
export const PROVIDER_MAX_WAITING = 8;
export const PROVIDER_TIMEOUT_MS = 8_000;

export const MUSIC_TEXT_MAX_LENGTH = 200;
