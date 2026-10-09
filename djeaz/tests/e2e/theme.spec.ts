import { expect, test } from "@playwright/test";

const ivory = "rgb(250, 249, 246)";
const charcoal = "rgb(37, 38, 49)";

test.describe("thème", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Le thème est couvert sur le projet desktop.");
  });

  test("sans préférence, un navigateur sombre charge la page en sombre", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    const html = await response?.text();

    const head = html?.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
    const blockingScript = head.match(/<script>(\([\s\S]*?djeaz-theme[\s\S]*?\)\(\);)<\/script>/);

    expect(blockingScript?.[1]).toContain('localStorage.getItem("djeaz-theme")');
    expect(blockingScript?.[1]).toContain('matchMedia("(prefers-color-scheme: dark)")');
    expect(blockingScript?.[1]).toContain('classList.toggle("dark"');
    expect(head.indexOf(blockingScript?.[0] ?? "")).toBeGreaterThan(-1);
    expect(html?.indexOf("<body")).toBeGreaterThan(
      html?.indexOf(blockingScript?.[0] ?? "missing") ?? 0,
    );

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("body")).toHaveCSS("background-color", charcoal);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
  });

  test("sans préférence, un navigateur clair charge la page en clair", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(page.locator("body")).toHaveCSS("background-color", ivory);
    await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();
  });

  test("le choix sombre survit au rechargement", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: "Passer en mode sombre" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("djeaz-theme"))).toBe("dark");
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("background-color", charcoal);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
  });

  test("le choix clair survit au rechargement", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("button", { name: "Passer en mode clair" }).click();

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("djeaz-theme"))).toBe("light");
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("background-color", ivory);
    await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();
  });

  test("une préférence sombre mémorisée prime sur un système clair", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      localStorage.setItem("djeaz-theme", "dark");
    });
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("background-color", charcoal);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
  });

  test("une préférence claire mémorisée prime sur un système sombre", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("djeaz-theme", "light");
    });
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("background-color", ivory);
    await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();
  });

  test("une valeur mémorisée inconnue suit le navigateur", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("djeaz-theme", "bleu");
    });
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
  });

  test("une valeur system mémorisée suit le navigateur", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("djeaz-theme", "system");
    });
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("background-color", charcoal);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("djeaz-theme"))).toBe("system");
  });

  test("sans préférence, un changement système met à jour la page ouverte", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "dark" });

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeVisible();
  });

  test("un choix explicite ignore un changement système", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("button", { name: "Passer en mode clair" }).click();

    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Passer en mode sombre" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("djeaz-theme"))).toBe("light");
  });

  test("le contrôle s'active au clavier", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Passer en mode sombre" });
    await toggle.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toBeFocused();
  });
});
