import { db } from "@/db/client.server";
import { createFileCheckpoint } from "@/features/music/checkpoint";
import { parseImportArgs } from "@/features/music/import-args";
import { runMusicImport } from "@/features/music/import-run";
import { createListenBrainzPopularity } from "@/features/music/listenbrainz.server";
import { persistImportedRecording } from "@/features/music/persist.server";
import { getCoverArtArchiveClient } from "@/features/music/cover-art.server";
import { getMusicBrainzProvider } from "@/features/music/musicbrainz.server";
import { getServerEnv } from "@/lib/env.server";

function databaseTarget(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return "cible illisible";
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, "")) || "inconnue";
  const port = url.port || "5432";
  return `${url.hostname || "hôte inconnu"}:${port}/${database}`;
}

function redact(message: string): string {
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://***");
}

async function main(): Promise<void> {
  const parsed = parseImportArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(parsed.message);
    process.exitCode = 1;
    return;
  }

  const env = getServerEnv();
  console.log(`Import musical — ${databaseTarget(env.DATABASE_URL)}`);
  console.log(
    `Limite ${parsed.data.limit}, artistes ${parsed.data.artists}, morceaux par artiste ${parsed.data.perArtist}, complément global ${parsed.data.global}.`,
  );

  const result = await runMusicImport({
    ...parsed.data,
    popularity: createListenBrainzPopularity(),
    music: getMusicBrainzProvider(),
    coverArt: getCoverArtArchiveClient(),
    persist: async (recording, artworkUrl) => {
      await persistImportedRecording(recording, artworkUrl);
    },
    checkpoint: createFileCheckpoint(parsed.data.checkpoint),
  });

  console.log(
    `Import terminé : ${result.imported} enregistrés, ${result.skipped} déjà traités, ${result.failed} échecs.`,
  );
  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

void (async () => {
  try {
    await main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    console.error(redact(message));
    process.exitCode = 1;
  } finally {
    if (!db.$client.ending) {
      await db.$client.end();
    }
  }
})();
