import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { expect, test } from "vitest";

import { resolveTestDatabaseUrl } from "./database";

const MIGRATION_DATABASE = "djeaz_migration";
const migrationsFolder = path.resolve(process.cwd(), "drizzle");

const EXPECTED_TABLES = [
  "catalog_categories",
  "catalog_tracks",
  "catalogs",
  "music_genres",
  "music_track_genres",
  "music_track_sources",
  "music_tracks",
] as const;

const EXPECTED_CONSTRAINTS = [
  "catalog_categories_id_catalog_id_unique",
  "catalog_tracks_catalog_id_music_track_id_unique",
  "catalog_tracks_category_catalog_fk",
  "music_track_genres_music_track_id_music_genre_id_pk",
  "music_track_sources_provider_external_id_unique",
] as const;

type Journal = {
  entries: { tag: string; when: number }[];
};

function migrationSql(prefix: string): string {
  const name = readdirSync(migrationsFolder).find(
    (file) => file.startsWith(`${prefix}_`) && file.endsWith(".sql"),
  );
  if (!name) {
    throw new Error(`Migration ${prefix} introuvable.`);
  }

  return readFileSync(path.join(migrationsFolder, name), "utf8");
}

function statements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function journalEntry(prefix: string): { tag: string; when: number } {
  const journal = JSON.parse(
    readFileSync(path.join(migrationsFolder, "meta", "_journal.json"), "utf8"),
  ) as Journal;
  const entry = journal.entries.find((item) => item.tag.startsWith(`${prefix}_`));
  if (!entry) {
    throw new Error(`Entrée de journal ${prefix} introuvable.`);
  }

  return entry;
}

function migrationDatabaseUrl(): string {
  const source = new URL(resolveTestDatabaseUrl());
  const target = new URL(source);
  target.pathname = `/${MIGRATION_DATABASE}`;

  const sourceName = decodeURIComponent(source.pathname.replace(/^\//, ""));
  const targetName = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (sourceName !== "djeaz_test" || targetName !== MIGRATION_DATABASE) {
    throw new Error("Refus de préparer une base autre que djeaz_migration.");
  }

  return target.toString();
}

async function recreateMigrationDatabase(): Promise<void> {
  const admin = new Pool({
    connectionString: resolveTestDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const current = await admin.query<{ current_database: string }>(
      "SELECT current_database() AS current_database",
    );
    if (current.rows[0]?.current_database !== "djeaz_test") {
      throw new Error("Refus de créer djeaz_migration depuis une autre base.");
    }

    await admin.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [MIGRATION_DATABASE],
    );
    await admin.query(`DROP DATABASE IF EXISTS ${MIGRATION_DATABASE}`);
    await admin.query(`CREATE DATABASE ${MIGRATION_DATABASE}`);
  } finally {
    await admin.end();
  }
}

async function dropMigrationDatabase(): Promise<void> {
  const admin = new Pool({
    connectionString: resolveTestDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await admin.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [MIGRATION_DATABASE],
    );
    await admin.query(`DROP DATABASE IF EXISTS ${MIGRATION_DATABASE}`);
  } finally {
    await admin.end();
  }
}

async function applySql(pool: Pool, sql: string): Promise<void> {
  for (const statement of statements(sql)) {
    await pool.query(statement);
  }
}

async function assertTargetSchema(pool: Pool): Promise<void> {
  const current = await pool.query<{ current_database: string }>(
    "SELECT current_database() AS current_database",
  );
  expect(current.rows[0]?.current_database).toBe(MIGRATION_DATABASE);

  const tables = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  const names = tables.rows.map((row) => row.table_name);
  for (const table of EXPECTED_TABLES) {
    expect(names).toContain(table);
  }
  expect(names).not.toContain("genres");
  expect(names).not.toContain("tracks");

  const columns = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'catalogs'`,
  );
  const catalogColumns = columns.rows.map((row) => row.column_name);
  expect(catalogColumns).toContain("revision");
  expect(catalogColumns).not.toContain("seed_version");

  const constraints = await pool.query<{ conname: string }>(
    "SELECT conname FROM pg_constraint WHERE conname = ANY($1::text[])",
    [EXPECTED_CONSTRAINTS],
  );
  expect(constraints.rows.map((row) => row.conname).sort()).toEqual(
    [...EXPECTED_CONSTRAINTS].sort(),
  );
}

test("0003 supprime l'ancien modèle sans le renommer", () => {
  const sql = migrationSql("0003");

  expect(sql).not.toMatch(/rename/i);
  expect(sql.indexOf('DROP TABLE "tracks"')).toBeGreaterThan(-1);
  expect(sql.indexOf('DROP TABLE "tracks"')).toBeLessThan(sql.indexOf('DROP TABLE "genres"'));
  expect(sql).toContain('DROP COLUMN "seed_version"');
  expect(sql).toContain(
    'FOREIGN KEY ("category_id","catalog_id") REFERENCES "public"."catalog_categories"("id","catalog_id")',
  );
  expect(sql).toContain('UNIQUE("provider","external_id")');
  expect(sql).toContain('UNIQUE("catalog_id","music_track_id")');
});

test("le rejeu 0000 → 0003 aboutit au schéma bibliothèque", async () => {
  await recreateMigrationDatabase();
  const pool = new Pool({
    connectionString: migrationDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await applySql(pool, migrationSql("0000"));
    await applySql(pool, migrationSql("0001"));
    await applySql(pool, migrationSql("0002"));
    await applySql(pool, migrationSql("0003"));
    await assertTargetSchema(pool);
  } finally {
    await pool.end();
    await dropMigrationDatabase();
  }
});

test("une base vierge et une base déjà en 0002 migrent vers le même schéma", async () => {
  await recreateMigrationDatabase();
  const virgin = new Pool({
    connectionString: migrationDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await migrate(drizzle({ client: virgin }), { migrationsFolder });
    await assertTargetSchema(virgin);
  } finally {
    await virgin.end();
    await dropMigrationDatabase();
  }

  await recreateMigrationDatabase();
  const upgrade = new Pool({
    connectionString: migrationDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await applySql(upgrade, migrationSql("0000"));
    await applySql(upgrade, migrationSql("0001"));
    await applySql(upgrade, migrationSql("0002"));

    const applied = journalEntry("0002");
    const hash = createHash("sha256").update(migrationSql("0002")).digest("hex");
    await upgrade.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await upgrade.query(
      `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )`,
    );
    await upgrade.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, applied.when],
    );

    await migrate(drizzle({ client: upgrade }), { migrationsFolder });
    await assertTargetSchema(upgrade);

    const journal = await upgrade.query<{ created_at: string }>(
      "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at",
    );
    expect(journal.rows.map((row) => Number(row.created_at))).toEqual([
      applied.when,
      journalEntry("0003").when,
    ]);
  } finally {
    await upgrade.end();
    await dropMigrationDatabase();
  }
});
