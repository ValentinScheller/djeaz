import { expect, test } from "@playwright/test";

test("une adresse inconnue affiche le 404 public", async ({ page }) => {
  const explode = page.waitForResponse(
    (response) => response.url().includes("/mascotte-animated-explode.lottie") && response.ok(),
  );
  const response = await page.goto("/adresse-inconnue");
  await explode;

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Cette page est introuvable." })).toBeVisible();
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.locator('img[src="/mascotte.svg"]')).toHaveAttribute("alt", "");
  // Le logo des outils de dev Next.js est hors coque et n'appartient pas à la page.
  await expect(page.locator("header, main, footer").getByRole("img")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole("link", { name: "Retour à l'accueil" }).click();
  await expect(page).toHaveURL("/");
});
