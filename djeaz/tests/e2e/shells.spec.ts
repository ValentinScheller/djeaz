import { expect, test } from "@playwright/test";

test("la coque publique propose le logo, la connexion et l'inscription", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "DJEAZ, accueil" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/sign-in");
  await expect(page.getByRole("link", { name: "Inscription" })).toHaveAttribute("href", "/sign-up");
  await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Votre set commence bien avant le premier morceau." }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
