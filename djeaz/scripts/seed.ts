import { db } from "@/db/client.server";
import { getServerEnv } from "@/lib/env.server";

import { seedSyntheticDemo } from "./seed-demo";

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
  const env = getServerEnv();
  console.log(`Seed synthétique — ${databaseTarget(env.DATABASE_URL)}`);
  await seedSyntheticDemo();
  console.log("Seed synthétique terminé.");
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
