import { expect, test } from "@playwright/test";

const privatePaths = ["/dashboard", "/catalog", "/settings"] as const;

for (const path of privatePaths) {
  test(`${path} sans session redirige vers la connexion`, async ({ page }) => {
    await page.goto(path);

    const url = new URL(page.url());
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("returnTo")).toBe(path);
    expect(url.search).toBe(`?returnTo=${encodeURIComponent(path)}`);
  });
}

test("la route Better Auth reste publique", async ({ request }) => {
  const response = await request.get("/api/auth/get-session");

  expect(response.status()).toBe(200);
  expect(response.headers().location).toBeUndefined();
  expect(await response.json()).toBeNull();
});
