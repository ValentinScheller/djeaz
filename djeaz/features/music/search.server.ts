import "server-only";

import { and, asc, sql } from "drizzle-orm";

import { db } from "@/db/client.server";
import { musicTracks } from "@/db/schema";
import { actionError, type ActionResult } from "@/lib/action-result";

import { EXTERNAL_SEARCH_LIMIT, LOCAL_SEARCH_LIMIT } from "./limits";
import { logProviderFailure } from "./http.server";
import { getMusicMetadataProvider } from "./provider.server";
import { escapeLikePattern, parseMusicQuery } from "./text";
import type { ExternalCandidate, LocalTrackHit } from "./types";

const LOCAL_FAILURE = "La recherche dans DJEAZ a échoué. Réessayez.";
const EXTERNAL_FAILURE =
  "La recherche élargie est indisponible. Les résultats DJEAZ restent utilisables.";
const QUERY_TOO_LONG = "La recherche est trop longue.";

function invalidQuery(reason: "too_long" | "too_many_tokens"): ActionResult<never> {
  return actionError("VALIDATION_ERROR", reason === "too_long" ? QUERY_TOO_LONG : QUERY_TOO_LONG);
}

export async function searchLocalTracks(
  query: string,
): Promise<ActionResult<{ results: LocalTrackHit[] }>> {
  const parsed = parseMusicQuery(query);
  if (!parsed.ok) {
    if (parsed.reason === "too_short") {
      return { ok: true, data: { results: [] } };
    }
    return invalidQuery(parsed.reason);
  }

  const normTitle = sql<string>`regexp_replace(lower(btrim(${musicTracks.title})), '[[:space:]]+', ' ', 'g')`;
  const normArtist = sql<string>`regexp_replace(lower(btrim(${musicTracks.artist})), '[[:space:]]+', ' ', 'g')`;
  const haystack = sql`${normTitle} || ' ' || ${normArtist}`;
  const prefix = `${escapeLikePattern(parsed.normalized)}%`;
  const rank = sql<number>`case
    when ${normTitle} = ${parsed.normalized} or ${normArtist} = ${parsed.normalized} then 0
    when ${normTitle} like ${prefix} escape '\\' or ${normArtist} like ${prefix} escape '\\' then 1
    else 2
  end`;

  try {
    const results = await db
      .select({
        id: musicTracks.id,
        title: musicTracks.title,
        artist: musicTracks.artist,
        albumTitle: musicTracks.albumTitle,
        artworkUrl: musicTracks.artworkUrl,
      })
      .from(musicTracks)
      .where(
        and(
          ...parsed.tokens.map((token) => {
            const pattern = `%${escapeLikePattern(token)}%`;
            return sql`${haystack} like ${pattern} escape '\\'`;
          }),
        ),
      )
      .orderBy(asc(rank), asc(normTitle), asc(normArtist), asc(musicTracks.id))
      .limit(LOCAL_SEARCH_LIMIT);

    return { ok: true, data: { results } };
  } catch (error) {
    console.error(`[music] search ${error instanceof Error ? error.name : "unknown"}`);
    return actionError("INTERNAL_ERROR", LOCAL_FAILURE);
  }
}

/** Lecture externe. N'écrit rien en base. */
export async function searchExternalRecordings(
  query: string,
): Promise<ActionResult<{ results: ExternalCandidate[] }>> {
  const parsed = parseMusicQuery(query);
  if (!parsed.ok) {
    if (parsed.reason === "too_short") {
      return { ok: true, data: { results: [] } };
    }
    return invalidQuery(parsed.reason);
  }

  try {
    const results = await getMusicMetadataProvider().searchRecordings(parsed.normalized);
    return {
      ok: true,
      data: {
        results: results.slice(0, EXTERNAL_SEARCH_LIMIT).map((recording) => ({
          externalId: recording.externalId,
          title: recording.title,
          artist: recording.artist,
          albumTitle: recording.albumTitle,
          durationMs: recording.durationMs,
          isrc: recording.isrc,
          disambiguation: recording.disambiguation,
        })),
      },
    };
  } catch (error) {
    logProviderFailure(error);
    return actionError("INTERNAL_ERROR", EXTERNAL_FAILURE);
  }
}
