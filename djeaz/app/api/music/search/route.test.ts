import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const envKeys = [
  "DATABASE_URL",
  "DATABASE_MIGRATION_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "MUSICBRAINZ_USER_AGENT",
] as const;

function clearServerEnv(): void {
  vi.resetModules();
  for (const key of envKeys) {
    delete process.env[key];
  }
}

test("le chargement des entrées musicales n'exige pas les secrets", async () => {
  clearServerEnv();

  const [localRoute, externalRoute, actions, catalogPage] = await Promise.all([
    import("@/app/api/music/search/route"),
    import("@/app/api/music/search/external/route"),
    import("@/features/catalog/actions"),
    import("@/app/(dashboard)/catalog/page"),
  ]);

  expect(localRoute.GET).toEqual(expect.any(Function));
  expect(externalRoute.POST).toEqual(expect.any(Function));
  expect(actions.createCategoryAction).toEqual(expect.any(Function));
  expect(catalogPage.default).toEqual(expect.any(Function));
});

test("une requête sans configuration échoue explicitement", async () => {
  clearServerEnv();

  const externalRoute = await import("@/app/api/music/search/external/route");
  const request = new Request("https://djeaz.test/api/music/search/external", {
    method: "POST",
    headers: {
      origin: "https://djeaz.test",
      host: "djeaz.test",
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: "daft punk" }),
  });

  await expect(externalRoute.POST(request)).rejects.toThrow(
    "Configuration serveur invalide : DATABASE_URL, DATABASE_MIGRATION_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL.",
  );
});
