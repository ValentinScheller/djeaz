import { expect, test } from "@playwright/test";

test("la page d'accueil se charge", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("DJEAZ");
  await expect(page.getByRole("img", { name: "DJEAZ mascotte" })).toBeVisible();
});
