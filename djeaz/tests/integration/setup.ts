import { beforeEach } from "vitest";

import { resetTestDatabase, resolveTestDatabaseUrl } from "./database";

const testDatabaseUrl = resolveTestDatabaseUrl();

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_MIGRATION_URL = testDatabaseUrl;
process.env.BETTER_AUTH_SECRET = "integration-test-secret";
process.env.BETTER_AUTH_URL = "http://127.0.0.1:3100";

beforeEach(async () => {
  await resetTestDatabase(testDatabaseUrl);
});
