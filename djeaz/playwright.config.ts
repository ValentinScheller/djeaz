import { defineConfig } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const e2eDatabaseUrl = "postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_test";

function e2eServerEnv(): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  // Les pages privées valident la session. Ce serveur ne doit pas viser une base distante.
  env.DATABASE_URL = e2eDatabaseUrl;
  env.DATABASE_MIGRATION_URL = e2eDatabaseUrl;
  env.BETTER_AUTH_SECRET = "e2e-placeholder-secret-32-characters-min";
  env.BETTER_AUTH_URL = baseURL;
  return env;
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: e2eServerEnv(),
  },
});
