import { expect, test } from "@playwright/test";

test("la page d'accueil se charge", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("DJEAZ - Préparation musicale pour DJ");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  await expect(page.locator("body")).toHaveCSS("line-height", "24px");
  await expect(page.locator("body")).toHaveCSS("font-family", /plusJakartaSans/);
  const fontFace = await page.evaluate(async () => {
    await document.fonts.ready;

    const face = [...document.fonts].find((item) => item.family === "plusJakartaSans");
    const requested = performance
      .getEntriesByType("resource")
      .some((entry) => entry.name.includes("plus_jakarta_sans"));

    return {
      weight: face?.weight ?? null,
      status: face?.status ?? null,
      requested,
      weights: [400, 500, 600, 700].map((weight) =>
        document.fonts.check(`${weight} 16px plusJakartaSans`),
      ),
    };
  });
  expect(fontFace).toEqual({
    weight: "200 800",
    status: "loaded",
    requested: true,
    weights: [true, true, true, true],
  });
});

test("la vitrine présente la promesse, le parcours et les accès DJ", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Votre set commence bien avant le premier morceau.",
    }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Créer mon espace DJ" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
  await expect(page.getByRole("link", { name: "Je me lance !" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
  await expect(page.getByRole("link", { name: "Se connecter" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
  await expect(page.getByRole("link", { name: "J'ai déjà un compte" })).toHaveAttribute(
    "href",
    "/sign-in",
  );

  await expect(page.getByRole("heading", { name: "Comment ça marche ?" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Un sondage auquel les invités ont vraiment envie de répondre.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Vous gardez toute la liberté de construire votre set/),
  ).toBeVisible();
});
