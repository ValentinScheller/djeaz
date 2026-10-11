import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const envKeys = [
  "DATABASE_URL",
  "DATABASE_MIGRATION_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

test("l'import de la route n'exige pas les secrets", async () => {
  vi.resetModules();
  for (const key of envKeys) {
    delete process.env[key];
  }

  const route = await import("@/app/api/auth/[...all]/route");

  expect(route.runtime).toBe("nodejs");
  expect(route.GET).toEqual(expect.any(Function));
  expect(route.POST).toEqual(expect.any(Function));
  expect(route).not.toHaveProperty("PATCH");
  expect(route).not.toHaveProperty("PUT");
  expect(route).not.toHaveProperty("DELETE");
});
