import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db/client.server";
import { musicTracks, musicTrackSources } from "@/db/schema";

import { canonicalizeCoverArtUrl } from "./cover-art";
import {
  decideDedupe,
  metadataFill,
  textLockKey,
  textMergeEligible,
  type KnownTrack,
} from "./dedupe";
import { COVER_ART_PROVIDER, DURATION_MATCH_TOLERANCE_MS, MUSICBRAINZ_PROVIDER } from "./limits";
import { normalizeMusicText } from "./text";
import type { ExternalRecording } from "./types";

export type MusicTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && typeof current === "object" && current !== null; depth += 1) {
    if ("code" in current && current.code === "23505") {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

export async function withMusicTransaction<T>(run: (tx: MusicTx) => Promise<T>): Promise<T> {
  try {
    return await db.transaction(run);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    return db.transaction(run);
  }
}

function acceptedArtwork(artworkUrl: string | null): string | null {
  if (!artworkUrl) {
    return null;
  }
  return canonicalizeCoverArtUrl(artworkUrl);
}

async function lockRecording(tx: MusicTx, recording: ExternalRecording): Promise<void> {
  const keys = [
    `provider:${recording.provider}:${recording.externalId}`,
    `recording:${recording.externalId}`,
  ];

  if (recording.isrc) {
    keys.push(`isrc:${recording.isrc}`);
  }

  const textKey = textLockKey(recording);
  if (textKey) {
    keys.push(textKey);
  }

  for (const key of keys.sort()) {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
  }
}

function toKnownTrack(
  row: typeof musicTracks.$inferSelect,
  sources: (typeof musicTrackSources.$inferSelect)[],
): KnownTrack {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    albumTitle: row.albumTitle,
    disambiguation: row.disambiguation,
    artworkUrl: row.artworkUrl,
    artworkProvider: row.artworkProvider,
    isrc: row.isrc,
    durationMs: row.durationMs,
    sources: sources
      .filter((source) => source.musicTrackId === row.id)
      .map((source) => ({ provider: source.provider, externalId: source.externalId })),
  };
}

async function loadKnownTracks(tx: MusicTx, ids: string[]): Promise<KnownTrack[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    return [];
  }

  const rows = await tx.select().from(musicTracks).where(inArray(musicTracks.id, unique));
  const sources = await tx
    .select()
    .from(musicTrackSources)
    .where(inArray(musicTrackSources.musicTrackId, unique));

  return rows.map((row) => toKnownTrack(row, sources));
}

async function candidateIds(tx: MusicTx, recording: ExternalRecording): Promise<string[]> {
  const sources = await tx
    .select({ musicTrackId: musicTrackSources.musicTrackId })
    .from(musicTrackSources)
    .where(
      and(
        eq(musicTrackSources.externalId, recording.externalId),
        or(
          eq(musicTrackSources.provider, recording.provider),
          eq(musicTrackSources.provider, MUSICBRAINZ_PROVIDER),
        ),
      ),
    );

  const ids = sources.map((source) => source.musicTrackId);

  if (recording.isrc) {
    const byIsrc = await tx
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(eq(musicTracks.isrc, recording.isrc));
    ids.push(...byIsrc.map((row) => row.id));
  }

  if (textMergeEligible(recording) && recording.durationMs !== null) {
    const title = normalizeMusicText(recording.title);
    const artist = normalizeMusicText(recording.artist);
    const normTitle = sql`regexp_replace(lower(btrim(${musicTracks.title})), '[[:space:]]+', ' ', 'g')`;
    const normArtist = sql`regexp_replace(lower(btrim(${musicTracks.artist})), '[[:space:]]+', ' ', 'g')`;
    const byText = await tx
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(
        and(
          sql`${normTitle} = ${title}`,
          sql`${normArtist} = ${artist}`,
          sql`${musicTracks.durationMs} is not null`,
          sql`abs(${musicTracks.durationMs} - ${recording.durationMs}) <= ${DURATION_MATCH_TOLERANCE_MS}`,
        ),
      );
    ids.push(...byText.map((row) => row.id));
  }

  return ids;
}

async function ensureSource(
  tx: MusicTx,
  musicTrackId: string,
  recording: ExternalRecording,
): Promise<void> {
  const [existing] = await tx
    .select()
    .from(musicTrackSources)
    .where(
      and(
        eq(musicTrackSources.provider, recording.provider),
        eq(musicTrackSources.externalId, recording.externalId),
      ),
    )
    .limit(1);

  if (!existing) {
    await tx.insert(musicTrackSources).values({
      musicTrackId,
      provider: recording.provider,
      externalId: recording.externalId,
      releaseId: recording.releaseId,
    });
    return;
  }

  if (existing.musicTrackId === musicTrackId && !existing.releaseId && recording.releaseId) {
    await tx
      .update(musicTrackSources)
      .set({ releaseId: recording.releaseId })
      .where(eq(musicTrackSources.id, existing.id));
  }
}

async function fillExisting(
  tx: MusicTx,
  track: KnownTrack,
  recording: ExternalRecording,
  artworkUrl: string | null,
): Promise<void> {
  const patch = metadataFill(track, {
    albumTitle: recording.albumTitle,
    disambiguation: recording.disambiguation,
    artworkUrl,
    artworkProvider: artworkUrl ? COVER_ART_PROVIDER : null,
    isrc: recording.isrc,
    durationMs: recording.durationMs,
  });

  if (!patch) {
    return;
  }

  await tx
    .update(musicTracks)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(musicTracks.id, track.id));
}

/**
 * Résout ou crée le morceau global. À appeler dans une transaction, sans appel réseau :
 * les verrous advisory ne doivent pas couvrir MusicBrainz ni Cover Art Archive.
 */
export async function persistCanonicalRecording(
  tx: MusicTx,
  recording: ExternalRecording,
  artworkUrl: string | null,
): Promise<string> {
  const safeArtwork = acceptedArtwork(artworkUrl);
  await lockRecording(tx, recording);

  const known = await loadKnownTracks(tx, await candidateIds(tx, recording));
  const decision = decideDedupe(recording, known);

  if (decision.action === "reuse") {
    const track = known.find((candidate) => candidate.id === decision.trackId);
    if (!track) {
      throw new Error("Morceau de rapprochement introuvable.");
    }
    await fillExisting(tx, track, recording, safeArtwork);
    await ensureSource(tx, track.id, recording);
    return track.id;
  }

  const [created] = await tx
    .insert(musicTracks)
    .values({
      title: recording.title,
      artist: recording.artist,
      albumTitle: recording.albumTitle,
      disambiguation: recording.disambiguation,
      artworkUrl: safeArtwork,
      artworkProvider: safeArtwork ? COVER_ART_PROVIDER : null,
      isrc: recording.isrc,
      durationMs: recording.durationMs,
    })
    .returning({ id: musicTracks.id });

  if (!created) {
    throw new Error("Morceau global non créé.");
  }

  await ensureSource(tx, created.id, recording);
  return created.id;
}

export async function persistImportedRecording(
  recording: ExternalRecording,
  artworkUrl: string | null,
): Promise<string> {
  return withMusicTransaction((tx) => persistCanonicalRecording(tx, recording, artworkUrl));
}
