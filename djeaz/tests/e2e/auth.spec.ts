import { expect, type Page, test } from "@playwright/test";

async function signOut(page: Page) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole("button", { name: "Menu" }).click();
  }

  await page.getByRole("button", { name: /DJ Démo/ }).click();
  await page.getByRole("menuitem", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
}

test("inscription, déconnexion puis connexion mènent au dashboard", async ({ page }) => {
  const email = `dj-${test.info().project.name}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = "motdepasse";

  await page.goto("/sign-up");
  await page.getByLabel("Nom").fill("DJ Test");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByLabel("Confirmation du mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/dashboard$/);

  await signOut(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Fdashboard$/);

  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
