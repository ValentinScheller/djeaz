import { MUSIC_QUERY_MAX_LENGTH, MUSIC_QUERY_MAX_TOKENS, MUSIC_QUERY_MIN_LENGTH } from "./limits";

const VARIANT_PATTERN =
  /\b(live|remix(?:ed)?|remaster(?:ed)?|radio|edit|acoustic|instrumental|demo|mono|extended|deluxe|karaoke|unplugged|session|mix|version|original)\b/i;

export function normalizeMusicText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseMusicQuery(
  input: string,
):
  | { ok: true; normalized: string; tokens: string[] }
  | { ok: false; reason: "too_short" | "too_long" | "too_many_tokens" } {
  const normalized = normalizeMusicText(input);

  if (normalized.length < MUSIC_QUERY_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }

  if (normalized.length > MUSIC_QUERY_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  const tokens = normalized.split(" ");
  if (tokens.length > MUSIC_QUERY_MAX_TOKENS) {
    return { ok: false, reason: "too_many_tokens" };
  }

  return { ok: true, normalized, tokens };
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function musicHaystack(title: string, artist: string): string {
  return `${normalizeMusicText(title)} ${normalizeMusicText(artist)}`;
}

/** Chaque token doit apparaître dans le titre ou l'artiste, pas forcément dans le même champ. */
export function matchesLocalQuery(
  track: { title: string; artist: string },
  normalizedQuery: string,
): boolean {
  const parsed = parseMusicQuery(normalizedQuery);
  if (!parsed.ok) {
    return false;
  }

  const haystack = musicHaystack(track.title, track.artist);
  return parsed.tokens.every((token) => haystack.includes(token));
}

/**
 * 0 exact, 1 préfixe, 2 contient.
 * Le préfixe et l'exact portent sur le titre entier ou l'artiste entier, pas sur la concaténation.
 */
export function localSearchRank(
  track: { title: string; artist: string },
  normalizedQuery: string,
): 0 | 1 | 2 {
  const title = normalizeMusicText(track.title);
  const artist = normalizeMusicText(track.artist);

  if (title === normalizedQuery || artist === normalizedQuery) {
    return 0;
  }

  if (title.startsWith(normalizedQuery) || artist.startsWith(normalizedQuery)) {
    return 1;
  }

  return 2;
}

export function hasVariantMarker(title: string, disambiguation: string | null): boolean {
  return (
    VARIANT_PATTERN.test(normalizeMusicText(title)) || VARIANT_PATTERN.test(disambiguation ?? "")
  );
}

export function clipMusicText(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 200);
}
