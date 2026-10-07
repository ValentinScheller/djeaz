import { defineConfig } from "drizzle-kit";

// `lib/env.server.ts` importe `server-only` : inutilisable dans la CLI Drizzle Kit.
function readMigrationUrl(): string {
  const url = process.env.DATABASE_MIGRATION_URL;

  if (!url) {
    throw new Error(
      "DATABASE_MIGRATION_URL est absente. Renseignez-la dans .env.local avant d'exécuter Drizzle Kit.",
    );
  }

  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    throw new Error("DATABASE_MIGRATION_URL est invalide.");
  }

  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    throw new Error("DATABASE_MIGRATION_URL est invalide.");
  }

  return url;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: readMigrationUrl(),
  },
});
