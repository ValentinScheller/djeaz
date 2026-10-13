import { expect, type Page, test } from "@playwright/test";

function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768;
}

async function expectSignedInIdentity(page: Page, email: string) {
  await expect(page.getByRole("heading", { name: "Aucun événement" })).toBeVisible();
  await expect(page.getByText("Camille Martin")).toHaveCount(0);

  if (isMobile(page)) {
    await page.getByRole("button", { name: "Menu" }).click();
  }

  const account = page.getByRole("button", { name: "DJ Nova" });
  await expect(account).toBeVisible();
  await expect(account).toContainText(email);

  if (isMobile(page)) {
    await page.getByRole("button", { name: "Fermer" }).click();
  }
}

async function signOut(page: Page) {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Menu" }).click();
  }

  await page.getByRole("button", { name: "DJ Nova" }).click();
  await page.getByRole("menuitem", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
}

test("inscription, déconnexion puis connexion mènent au dashboard", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `dj-${test.info().project.name}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = "motdepasse";

  await page.goto("/sign-up");
  await page.getByLabel("Nom / Prénom").fill("Camille Martin");
  await page.getByLabel("Nom d'artiste").fill("DJ Nova");
  await page.getByLabel("Adresse e-mail").fill(email);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByLabel("Confirmation du mot de passe").fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const reached = await page.waitForURL(/\/dashboard$/, { timeout: 12_000 }).then(
      () => true,
      () => false,
    );
    if (reached) {
      break;
    }
    if ((await page.getByText("Trop de tentatives").isVisible()) && attempt < 2) {
      await page.waitForTimeout(11_000);
      continue;
    }
    break;
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectSignedInIdentity(page, email);

  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/dashboard$/);

  await signOut(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Fdashboard$/);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    const reached = await page.waitForURL(/\/dashboard$/, { timeout: 12_000 }).then(
      () => true,
      () => false,
    );
    if (reached) {
      break;
    }
    if ((await page.getByText("Trop de tentatives").isVisible()) && attempt < 2) {
      await page.waitForTimeout(11_000);
      continue;
    }
    break;
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectSignedInIdentity(page, email);
});
