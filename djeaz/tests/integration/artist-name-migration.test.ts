import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Pool } from "pg";
import { expect, test } from "vitest";

import { resolveTestDatabaseUrl } from "./database";

const MIGRATION_DATABASE = "djeaz_migration";

function migrationSql(prefix: string): string {
  const folder = path.resolve(process.cwd(), "drizzle");
  const name = readdirSync(folder).find(
    (file) => file.startsWith(`${prefix}_`) && file.endsWith(".sql"),
  );
  if (!name) {
    throw new Error(`Migration ${prefix} introuvable.`);
  }

  return readFileSync(path.join(folder, name), "utf8");
}

function statements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
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

test("0002 recopie le nom des comptes existants puis rend artist_name obligatoire", async () => {
  const migration = migrationSql("0002");
  expect(migration).toContain('ADD COLUMN "artist_name" text;');
  expect(migration).not.toContain('ADD COLUMN "artist_name" text NOT NULL');
  expect(migration).toContain('SET "artist_name" = "name"');
  expect(migration).toContain('ALTER COLUMN "artist_name" SET NOT NULL');
  expect(migration.toLowerCase()).not.toContain("unique");
  expect(migration.toLowerCase()).not.toContain("drop ");
  expect(migration).not.toMatch(/CREATE INDEX|ALTER TABLE "(?!user")/i);

  await recreateMigrationDatabase();
  const pool = new Pool({
    connectionString: migrationDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const current = await pool.query<{ current_database: string }>(
      "SELECT current_database() AS current_database",
    );
    expect(current.rows[0]?.current_database).toBe(MIGRATION_DATABASE);

    await applySql(pool, migrationSql("0000"));
    await applySql(pool, migrationSql("0001"));
    await pool.query(
      `INSERT INTO "user" (id, name, email) VALUES
        ('legacy-1', 'Camille Martin', 'un@example.com'),
        ('legacy-2', 'Camille Martin', 'deux@example.com')`,
    );

    await applySql(pool, migration);

    const rows = await pool.query<{ name: string; artist_name: string }>(
      'SELECT name, artist_name FROM "user" ORDER BY id',
    );
    expect(rows.rows).toEqual([
      { name: "Camille Martin", artist_name: "Camille Martin" },
      { name: "Camille Martin", artist_name: "Camille Martin" },
    ]);

    const column = await pool.query<{
      data_type: string;
      is_nullable: string;
      character_maximum_length: number | null;
    }>(
      `SELECT data_type, is_nullable, character_maximum_length
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'artist_name'`,
    );
    expect(column.rows[0]).toEqual({
      data_type: "text",
      is_nullable: "NO",
      character_maximum_length: null,
    });

    const indexes = await pool.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'user' AND indexdef ILIKE '%artist_name%'",
    );
    expect(indexes.rows).toHaveLength(0);

    await expect(
      pool.query(
        `INSERT INTO "user" (id, name, email, artist_name)
         VALUES ('legacy-3', 'Alex', 'trois@example.com', NULL)`,
      ),
    ).rejects.toMatchObject({ code: "23502" });

    await pool.query(
      `INSERT INTO "user" (id, name, email, artist_name) VALUES
        ('legacy-4', 'Alex', 'quatre@example.com', 'Même scène'),
        ('legacy-5', 'Sam', 'cinq@example.com', 'Même scène')`,
    );
  } finally {
    await pool.end();
    await dropMigrationDatabase();
  }
});
