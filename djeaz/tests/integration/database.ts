import { readFileSync } from "node:fs";
import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const TEST_DATABASE_NAME = "djeaz_test";
const DEFAULT_TEST_DATABASE_URL = "postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_test";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type MigrationJournal = {
  entries?: unknown[];
};

export function resolveTestDatabaseUrl(): string {
  const configured = process.env.TEST_DATABASE_URL?.trim();
  const connectionString = configured || DEFAULT_TEST_DATABASE_URL;
  assertLocalTestDatabaseUrl(connectionString);
  return connectionString;
}

export function assertLocalTestDatabaseUrl(connectionString: string): void {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("URL de test PostgreSQL invalide.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("URL de test PostgreSQL invalide.");
  }

  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error("Refus de réinitialiser une base non locale.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (database !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refus de réinitialiser la base « ${database || "absente"} ». Seule ${TEST_DATABASE_NAME} est autorisée.`,
    );
  }
}

export async function assertConnectedTestDatabase(pool: Pool): Promise<void> {
  const result = await pool.query<{ current_database: string }>(
    "SELECT current_database() AS current_database",
  );
  const name = result.rows[0]?.current_database;

  if (name !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refus de réinitialiser : la base courante est « ${name ?? "inconnue"} ». Seule ${TEST_DATABASE_NAME} est autorisée.`,
    );
  }
}

function readMigrationEntries(migrationsFolder: string): unknown[] {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  let journal: MigrationJournal;

  try {
    journal = JSON.parse(readFileSync(journalPath, "utf8")) as MigrationJournal;
  } catch {
    throw new Error("Journal de migrations introuvable : la base de test n'a pas été modifiée.");
  }

  if (!Array.isArray(journal.entries)) {
    throw new Error("Journal de migrations invalide : la base de test n'a pas été modifiée.");
  }

  return journal.entries;
}

export async function resetTestDatabase(connectionString: string): Promise<void> {
  assertLocalTestDatabaseUrl(connectionString);

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const migrations = readMigrationEntries(migrationsFolder);
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await assertConnectedTestDatabase(pool);
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("CREATE SCHEMA public");

    if (migrations.length > 0) {
      await migrate(drizzle({ client: pool }), { migrationsFolder });
    }
  } finally {
    await pool.end();
  }
}
