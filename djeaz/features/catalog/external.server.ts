import "server-only";

import { logProviderFailure } from "@/features/music/http.server";
import { isRecordingMbid } from "@/features/music/musicbrainz-parse";
import { getCoverArtClient, getMusicMetadataProvider } from "@/features/music/provider.server";
import { actionError, type ActionResult } from "@/lib/action-result";

import { addCanonicalRecordingToCategory, type CatalogChange } from "./mutations.server";

const EXTERNAL_FAILURE =
  "La recherche élargie est indisponible. Les résultats DJEAZ restent utilisables.";

/**
 * MusicBrainz et Cover Art Archive sont appelés avant la transaction.
 * Le verrou du catalogue n'est pris qu'ensuite, dans l'ajout.
 */
export async function selectExternalRecording(
  userId: string,
  categoryId: string,
  recordingId: string,
): Promise<ActionResult<CatalogChange & { associationId: string; musicTrackId: string }>> {
  if (!isRecordingMbid(recordingId)) {
    return actionError("VALIDATION_ERROR", "Identifiant de morceau invalide.");
  }

  let recording;
  try {
    recording = await getMusicMetadataProvider().getRecording(recordingId);
  } catch (error) {
    logProviderFailure(error);
    return actionError("INTERNAL_ERROR", EXTERNAL_FAILURE);
  }

  if (!recording) {
    return actionError("NOT_FOUND", "Introuvable.");
  }

  let artworkUrl: string | null = null;
  if (recording.releaseId) {
    try {
      artworkUrl = await getCoverArtClient().lookupThumbnailUrl(recording.releaseId);
    } catch (error) {
      logProviderFailure(error);
      artworkUrl = null;
    }
  }

  return addCanonicalRecordingToCategory(userId, categoryId, recording, artworkUrl);
}
