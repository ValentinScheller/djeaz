import { expect, test } from "@playwright/test";

test("la page d'accueil se charge", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("DJEAZ - Préparation musicale pour DJ");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  await expect(page.locator("body")).toHaveCSS("line-height", "24px");
  await expect(page.locator("body")).toHaveCSS("font-family", /plusJakartaSans/);
  const fontFace = await page.evaluate(async () => {
    await document.fonts.ready;

    const face = [...document.fonts].find((item) => item.family === "plusJakartaSans");
    const requested = performance
      .getEntriesByType("resource")
      .some((entry) => entry.name.includes("plus_jakarta_sans"));

    return {
      weight: face?.weight ?? null,
      status: face?.status ?? null,
      requested,
      weights: [400, 500, 600, 700].map((weight) =>
        document.fonts.check(`${weight} 16px plusJakartaSans`),
      ),
    };
  });
  expect(fontFace).toEqual({
    weight: "200 800",
    status: "loaded",
    requested: true,
    weights: [true, true, true, true],
  });
});
