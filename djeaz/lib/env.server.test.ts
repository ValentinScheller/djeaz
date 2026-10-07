import { beforeEach, expect, test, vi } from "vitest";

// Cible le harnais uniquement : le paquet réel continue de bloquer le bundle client.
vi.mock("server-only", () => ({}));

const envKeys = [
  "DATABASE_URL",
  "DATABASE_MIGRATION_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

const validEnv = {
  DATABASE_URL: "postgresql://djeaz:local-password@127.0.0.1:5432/djeaz_dev",
  DATABASE_MIGRATION_URL: "postgresql://djeaz:local-password@127.0.0.1:5432/djeaz_dev",
  BETTER_AUTH_SECRET: "local-auth-secret",
  BETTER_AUTH_URL: "http://127.0.0.1:3000",
};

function errorMessage(run: () => void): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }

  return "";
}

async function loadGetServerEnv() {
  const envModule = await import("@/lib/env.server");
  return envModule.getServerEnv;
}

beforeEach(() => {
  // Recharge le module : le cache privé de getServerEnv() repart sans API de reset.
  vi.resetModules();
  for (const key of envKeys) {
    delete process.env[key];
  }
});

test("accepte une configuration valide", async () => {
  Object.assign(process.env, validEnv);

  const getServerEnv = await loadGetServerEnv();

  expect(getServerEnv()).toEqual(validEnv);
});

test("rejette une configuration invalide sans divulguer les valeurs", async () => {
  const databaseSecret = "super-secret-db-value";
  const authSecret = "super-secret-auth-value";

  process.env.DATABASE_URL = `not-a-url-${databaseSecret}`;
  process.env.DATABASE_MIGRATION_URL = `not-a-url-${databaseSecret}`;
  process.env.BETTER_AUTH_SECRET = "";
  process.env.BETTER_AUTH_URL = `not-a-url-${authSecret}`;

  const getServerEnv = await loadGetServerEnv();
  const message = errorMessage(() => getServerEnv());

  expect(message).toMatch(/Configuration serveur invalide/);
  expect(message).toContain("DATABASE_URL");
  expect(message).toContain("DATABASE_MIGRATION_URL");
  expect(message).toContain("BETTER_AUTH_SECRET");
  expect(message).toContain("BETTER_AUTH_URL");
  expect(message).not.toContain(databaseSecret);
  expect(message).not.toContain(authSecret);
});

test("isole le cache de configuration entre les scénarios", async () => {
  Object.assign(process.env, validEnv);
  const first = await loadGetServerEnv();
  expect(first().BETTER_AUTH_URL).toBe(validEnv.BETTER_AUTH_URL);

  const leaked = "super-secret-auth-value";
  process.env.BETTER_AUTH_URL = `not-a-url-${leaked}`;
  expect(first().BETTER_AUTH_URL).toBe(validEnv.BETTER_AUTH_URL);

  vi.resetModules();
  const second = await loadGetServerEnv();
  const message = errorMessage(() => second());

  expect(message).toMatch(/BETTER_AUTH_URL/);
  expect(message).not.toContain(leaked);
  expect(message).not.toContain(validEnv.BETTER_AUTH_SECRET);
});
