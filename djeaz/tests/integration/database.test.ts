import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  assertConnectedTestDatabase,
  assertLocalTestDatabaseUrl,
  resetTestDatabase,
} from "./database";

const DEV_DATABASE_URL = "postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_dev";

afterAll(async () => {
  const { db } = await import("@/db/client.server");
  await db.$client.end();
});

test("se connecte à djeaz_test", async () => {
  const { db } = await import("@/db/client.server");
  const result = await db.execute<{ current_database: string }>(
    sql`SELECT current_database() AS current_database`,
  );

  expect(result.rows[0]?.current_database).toBe("djeaz_test");
});

test("vérifie la base courante et refuse djeaz_dev", async () => {
  const pool = new Pool({
    connectionString: DEV_DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const current = await pool.query<{ current_database: string }>(
      "SELECT current_database() AS current_database",
    );
    expect(current.rows[0]?.current_database).toBe("djeaz_dev");

    await expect(assertConnectedTestDatabase(pool)).rejects.toThrow(/djeaz_dev/);
    await expect(resetTestDatabase(DEV_DATABASE_URL)).rejects.toThrow(/djeaz_dev/);

    const after = await pool.query<{ current_database: string }>(
      "SELECT current_database() AS current_database",
    );
    const schema = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname = 'public'");

    expect(after.rows[0]?.current_database).toBe("djeaz_dev");
    expect(schema.rowCount).toBe(1);
  } finally {
    await pool.end();
  }
});

test("refuse une URL distante ou ambiguë", () => {
  const secret = "remote-secret-value";
  let message = "";

  expect(() => {
    try {
      assertLocalTestDatabaseUrl(`postgresql://user:${secret}@db.example.com:5432/djeaz_test`);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }).toThrow(/non locale/);
  expect(message).not.toContain(secret);

  expect(() => assertLocalTestDatabaseUrl(DEV_DATABASE_URL)).toThrow(/djeaz_dev/);
  expect(() => assertLocalTestDatabaseUrl("postgresql://djeaz:djeaz@127.0.0.1:5432/")).toThrow(
    /absente/,
  );
});
