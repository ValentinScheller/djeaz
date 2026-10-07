import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getServerEnv } from "@/lib/env.server";

const globalForDb = globalThis as typeof globalThis & {
  __djeazPgPool?: Pool;
};

function getPool(): Pool {
  const existing = globalForDb.__djeazPgPool;
  if (existing) {
    return existing;
  }

  const pool = new Pool({
    connectionString: getServerEnv().DATABASE_URL,
    // Assez pour quelques requêtes locales simultanées, sans saturer une instance serverless.
    max: 5,
  });

  pool.on("error", () => {
    console.error("Erreur inattendue du pool PostgreSQL.");
  });

  // Next réévalue ce module au hot reload ; un seul pool par processus en développement.
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__djeazPgPool = pool;
  }

  return pool;
}

export const db = drizzle({ client: getPool() });
