import { Pool } from "pg";
import { expect, type Page, test } from "@playwright/test";

const databaseUrl = "postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_test";
const trackId = "b2000000-0000-4000-8000-000000000099";
const secondTrackId = "b2000000-0000-4000-8000-000000000098";

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
       values ($1, 'Bohemian Rhapsody', 'Queen', 'A Night at the Opera'),
              ($2, 'Zephyr Minuit', 'Nova Test', 'Nuit claire')
       on conflict (id) do nothing`,
      [trackId, secondTrackId],
    );
  } finally {
    await pool.end();
  }
});

async function createCategory(page: Page, name: string) {
  await page.getByRole("button", { name: "Créer une catégorie" }).click();
  const dialog = page.getByRole("dialog", { name: "Créer une catégorie" });
  await expect(dialog.getByLabel("Nom")).toBeFocused();
  await dialog.getByLabel("Nom").fill(name);
  await dialog.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole("tab", { name, selected: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer une catégorie" })).toBeFocused();
}

test("un DJ construit son catalogue et un autre ne le voit pas", async ({ page }) => {
  test.setTimeout(120_000);
  const email = `catalog-${test.info().project.name}-${Date.now()}@example.com`;
  await signUp(page, email);
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Catégories" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Créer ma première catégorie" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Supprimer la catégorie" })).toBeDisabled();

  await createCategory(page, "Cocktail");
  await createCategory(page, "Dancefloor");

  await page.getByRole("button", { name: "Ajouter un titre" }).click();
  const search = page.getByRole("dialog", { name: "Ajouter un titre" });
  await search.getByLabel("Rechercher un morceau").fill("queen boh");
  const queen = search
    .getByRole("listitem")
    .filter({ hasText: "Bohemian Rhapsody" })
    .filter({ hasText: "Queen" });
  await expect(queen).toBeVisible({ timeout: 20_000 });
  await queen.getByRole("button", { name: "Ajouter Bohemian Rhapsody" }).click();
  await expect(search).toBeHidden({ timeout: 20_000 });

  const bohemian = page
    .getByRole("listitem")
    .filter({ hasText: "A Night at the Opera" })
    .filter({ has: page.getByRole("button", { name: "Retirer Bohemian Rhapsody" }) });
  await expect(bohemian).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Ajouter un titre" }).click();
  await expect(search.getByLabel("Rechercher un morceau")).toHaveValue("");
  await expect(search.getByText("Bohemian Rhapsody")).toHaveCount(0);
  await search.getByLabel("Rechercher un morceau").fill("zephyr");
  const zephyrResult = search.getByRole("listitem").filter({ hasText: "Zephyr Minuit" });
  await expect(zephyrResult).toBeVisible({ timeout: 20_000 });
  await zephyrResult.getByRole("button", { name: "Ajouter Zephyr Minuit" }).click();
  await expect(search).toBeHidden({ timeout: 20_000 });

  const zephyr = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Retirer Zephyr Minuit" }) });
  await expect(zephyr).toBeVisible({ timeout: 20_000 });
  await expect(bohemian.getByRole("button", { name: "Monter Bohemian Rhapsody" })).toBeDisabled();
  await bohemian.getByRole("button", { name: "Descendre Bohemian Rhapsody" }).click();
  await expect(bohemian.getByRole("button", { name: "Monter Bohemian Rhapsody" })).toBeEnabled({
    timeout: 20_000,
  });

  await bohemian.getByRole("button", { name: "Déplacer Bohemian Rhapsody" }).click();
  await page.getByRole("menuitem", { name: "Cocktail" }).click();
  await expect(bohemian).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole("tab", { name: "Cocktail" }).click();
  await expect(page.getByRole("button", { name: "Retirer Bohemian Rhapsody" })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("tab", { name: "Dancefloor" }).click();
  await zephyr.getByRole("button", { name: "Retirer Zephyr Minuit" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Retirer", exact: true }).click();
  await expect(page.getByText("Cette catégorie ne contient aucun morceau.")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Supprimer la catégorie Dancefloor" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm.getByText("Supprimer la catégorie « Dancefloor » ?")).toBeVisible();
  await expect(confirm.getByText(/bibliothèque DJEAZ ne sont pas supprimés/)).toBeVisible();
  await confirm.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Dancefloor" })).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole("tab", { name: "Cocktail", selected: true })).toBeVisible();

  await signOut(page);
  await signUp(page, `other-${email}`);
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Créer ma première catégorie" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Cocktail" })).toHaveCount(0);
  await expect(page.getByText("Bohemian Rhapsody")).toHaveCount(0);
});

test("le bouton Rechercher plus largement affiche une source distincte", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `wide-${test.info().project.name}-${Date.now()}@example.com`;
  await signUp(page, email);
  await page.goto("/catalog");
  await createCategory(page, "Soirée");
  await page.getByRole("button", { name: "Ajouter un titre" }).click();
  const search = page.getByRole("dialog", { name: "Ajouter un titre" });
  await search.getByLabel("Rechercher un morceau").fill("lointain");
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
