import { expect, test } from "@playwright/test";

test("la page d'accueil se charge", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("DJEAZ — Préparation musicale pour DJs événementiels");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  await expect(page.locator("body")).toHaveCSS("line-height", "24px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Plus Jakarta Sans/);
  await expect(page.getByRole("img", { name: "DJEAZ mascotte" })).toBeVisible();
});
