import { Pool } from "pg";
import { expect, type Page, test } from "@playwright/test";

const databaseUrl = "postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_test";
const trackId = "b2000000-0000-4000-8000-000000000099";

function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768;
}

async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Nom / Prénom").fill("Camille Martin");
  await page.getByLabel("Nom d'artiste").fill("DJ Nova");
  await page.getByLabel("Adresse e-mail").fill(email);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Mot de passe", { exact: true }).fill("motdepasse");
    await page.getByLabel("Confirmation du mot de passe").fill("motdepasse");
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    const reached = await page.waitForURL(/\/dashboard$/, { timeout: 12_000 }).then(
      () => true,
      () => false,
    );
    if (reached) {
      return;
    }

    const limited = await page.getByText("Trop de tentatives").isVisible();
    if (limited && attempt < 2) {
      await page.waitForTimeout(11_000);
      continue;
    }

    break;
  }

  await expect(page).toHaveURL(/\/dashboard$/);
}

async function signOut(page: Page) {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await page.getByRole("button", { name: "DJ Nova" }).click();
  await page.getByRole("menuitem", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
}

test.beforeAll(async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    await pool.query(
      `insert into music_tracks (id, title, artist, album_title)
       values ($1, 'Bohemian Rhapsody', 'Queen', 'A Night at the Opera')
       on conflict (id) do nothing`,
      [trackId],
    );
  } finally {
    await pool.end();
  }
});

test("un DJ construit son catalogue et un autre ne le voit pas", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `catalog-${test.info().project.name}-${Date.now()}@example.com`;
  await signUp(page, email);
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Créer ma première catégorie" })).toBeVisible();

  await page.getByLabel("Nom de la catégorie").fill("Cocktail");
  await page.getByRole("button", { name: "Créer la catégorie" }).click();
  await expect(page.getByRole("heading", { name: "Cocktail" })).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("Rechercher un morceau").fill("queen boh");
  await expect(page.getByRole("heading", { name: "Dans DJEAZ" })).toBeVisible();
  const localResult = page
    .getByRole("listitem")
    .filter({ hasText: "Bohemian Rhapsody" })
    .filter({ hasText: "Queen" });
  await expect(localResult.first()).toBeVisible({ timeout: 20_000 });
  await localResult.first().getByRole("button", { name: "Ajouter Bohemian Rhapsody" }).click();

  const placed = page
    .getByRole("listitem")
    .filter({ hasText: "A Night at the Opera" })
    .filter({ has: page.getByRole("button", { name: "Retirer Bohemian Rhapsody" }) });
  await expect(placed).toBeVisible({ timeout: 20_000 });

  await placed.getByRole("button", { name: "Retirer Bohemian Rhapsody" }).click();
  await page.getByRole("button", { name: "Confirmer le retrait" }).click();
  await expect(page.getByText("Cette catégorie ne contient aucun morceau.")).toBeVisible({
    timeout: 20_000,
  });

  await signOut(page);
  await signUp(page, `other-${email}`);
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Créer ma première catégorie" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cocktail" })).toHaveCount(0);
  await expect(page.getByText("Bohemian Rhapsody")).toHaveCount(0);
});

test("le bouton Rechercher plus largement affiche une source distincte", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `wide-${test.info().project.name}-${Date.now()}@example.com`;
  await signUp(page, email);
  await page.goto("/catalog");
  await page.getByLabel("Nom de la catégorie").fill("Soirée");
  await page.getByRole("button", { name: "Créer la catégorie" }).click();
  await expect(page.getByRole("heading", { name: "Soirée" })).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("Rechercher un morceau").fill("lointain");
  await expect(page.getByText("Aucun morceau dans DJEAZ pour cette recherche.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: "Autres sources" })).toHaveCount(0);

  await page.getByRole("button", { name: "Rechercher plus largement" }).click();
  await expect(page.getByRole("heading", { name: "Autres sources" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Morceau élargi")).toBeVisible();
  await expect(page.getByText("Cette catégorie ne contient aucun morceau.")).toBeVisible();
});
