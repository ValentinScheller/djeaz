import { expect, test } from "@playwright/test";

test("la coque publique propose le logo, la connexion et l'inscription", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "DJEAZ, accueil" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/sign-in");
  await expect(page.getByRole("link", { name: "Inscription" })).toHaveAttribute("href", "/sign-up");
  await expect(page.getByRole("group", { name: "Thème" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "DJEAZ - Préparation musicale pour DJ" }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test.describe("dashboard desktop", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "La sidebar complète est couverte sur desktop.");
  });

  test("affiche la navigation et change de page", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Paramètres" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();

    await nav.getByRole("link", { name: "Catalogue" }).click();
    await expect(page).toHaveURL("/catalog");
    await expect(page.getByRole("heading", { name: "Catalogue", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("dashboard mobile", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Le tiroir est couvert sur mobile.");
  });

  test("ouvre et ferme le menu", async ({ page }) => {
    await page.goto("/dashboard");

    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await menu.click();
    const dialog = page.getByRole("dialog", { name: "Navigation" });
    await expect(dialog.getByRole("link", { name: "Catalogue" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
  });
});
