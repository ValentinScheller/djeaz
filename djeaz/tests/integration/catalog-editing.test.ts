import { asc, eq } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db/client.server";
import { catalogCategories, catalogs, catalogTracks, musicTracks, user } from "@/db/schema";
import {
  addLocalTrackForUser,
  createCategoryForUser,
  moveCatalogTrackForUser,
  removeCatalogTrackForUser,
  reorderCatalogTrackForUser,
} from "@/features/catalog/mutations.server";

afterAll(async () => {
  if (!db.$client.ending) {
    await db.$client.end();
  }
});

async function revisionOf(userId: string): Promise<number> {
  const [catalog] = await db
    .select({ revision: catalogs.revision })
    .from(catalogs)
    .where(eq(catalogs.ownerId, userId));
  return catalog?.revision ?? -1;
}

async function insertUser(id: string) {
  await db.insert(user).values({
    id,
    name: "DJ",
    artistName: id,
    email: `${id}@example.com`,
  });
  const { ensureCatalogForUser } = await import("@/features/catalog/ensure-catalog.server");
  return ensureCatalogForUser(id);
}

async function insertTrack(title: string) {
  const [track] = await db
    .insert(musicTracks)
    .values({ title, artist: "Artiste", albumTitle: "Album" })
    .returning();
  if (!track) {
    throw new Error("Morceau absent.");
  }
  return track;
}

test("crée une catégorie, ajoute, refuse le doublon et incrémente la révision une fois", async () => {
  await insertUser("dj-edit");
  expect(await revisionOf("dj-edit")).toBe(0);

  const category = await createCategoryForUser("dj-edit", "  Cocktail  ");
  expect(category.ok && category.data.changed).toBe(true);
  expect(await revisionOf("dj-edit")).toBe(1);
  const [stored] = await db.select().from(catalogCategories);
  expect(stored?.name).toBe("Cocktail");
  expect(stored?.displayOrder).toBe(0);

  const invalid = await createCategoryForUser("dj-edit", "   ");
  expect(invalid.ok).toBe(false);
  expect(await revisionOf("dj-edit")).toBe(1);

  const track = await insertTrack("Nuit Indigo");
  if (!category.ok) {
    throw new Error("Catégorie attendue.");
  }
  const added = await addLocalTrackForUser("dj-edit", category.data.categoryId, track.id);
  expect(added.ok).toBe(true);
  expect(await revisionOf("dj-edit")).toBe(2);

  const duplicate = await addLocalTrackForUser("dj-edit", category.data.categoryId, track.id);
  expect(duplicate).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  expect(await revisionOf("dj-edit")).toBe(2);
  expect(await db.select().from(catalogTracks)).toHaveLength(1);
});

test("le retrait conserve le morceau global", async () => {
  await insertUser("dj-remove");
  const category = await createCategoryForUser("dj-remove", "Ouverture");
  const track = await insertTrack("Velours");
  if (!category.ok) {
    throw new Error("Catégorie attendue.");
  }
  const added = await addLocalTrackForUser("dj-remove", category.data.categoryId, track.id);
  if (!added.ok) {
    throw new Error(added.error.message);
  }

  const removed = await removeCatalogTrackForUser("dj-remove", added.data.associationId);
  expect(removed.ok).toBe(true);
  expect(await db.select().from(catalogTracks)).toEqual([]);
  expect(await db.select().from(musicTracks).where(eq(musicTracks.id, track.id))).toHaveLength(1);
});

test("déplace et réordonne en incrémentant la révision, sans effet sur un no-op", async () => {
  await insertUser("dj-move");
  const first = await createCategoryForUser("dj-move", "Un");
  const second = await createCategoryForUser("dj-move", "Deux");
  const alpha = await insertTrack("Alpha");
  const beta = await insertTrack("Beta");
  if (!first.ok || !second.ok) {
    throw new Error("Catégories attendues.");
  }

  const addedAlpha = await addLocalTrackForUser("dj-move", first.data.categoryId, alpha.id);
  const addedBeta = await addLocalTrackForUser("dj-move", first.data.categoryId, beta.id);
  if (!addedAlpha.ok || !addedBeta.ok) {
    throw new Error("Associations attendues.");
  }
  const before = await revisionOf("dj-move");

  const moved = await moveCatalogTrackForUser(
    "dj-move",
    addedBeta.data.associationId,
    second.data.categoryId,
  );
  expect(moved.ok && moved.data.changed).toBe(true);
  expect(await revisionOf("dj-move")).toBe(before + 1);

  const samePlace = await moveCatalogTrackForUser(
    "dj-move",
    addedBeta.data.associationId,
    second.data.categoryId,
  );
  expect(samePlace.ok && samePlace.data.changed).toBe(false);
  expect(await revisionOf("dj-move")).toBe(before + 1);

  const down = await reorderCatalogTrackForUser("dj-move", addedAlpha.data.associationId, "down");
  expect(down.ok && down.data.changed).toBe(false);
  expect(await revisionOf("dj-move")).toBe(before + 1);

  const gamma = await insertTrack("Gamma");
  const addedGamma = await addLocalTrackForUser("dj-move", first.data.categoryId, gamma.id);
  if (!addedGamma.ok) {
    throw new Error(addedGamma.error.message);
  }
  const reordered = await reorderCatalogTrackForUser(
    "dj-move",
    addedGamma.data.associationId,
    "up",
  );
  expect(reordered.ok && reordered.data.changed).toBe(true);

  const rows = await db
    .select({ id: catalogTracks.id, displayOrder: catalogTracks.displayOrder })
    .from(catalogTracks)
    .where(eq(catalogTracks.categoryId, first.data.categoryId));
  const gammaRow = rows.find((row) => row.id === addedGamma.data.associationId);
  const alphaRow = rows.find((row) => row.id === addedAlpha.data.associationId);
  expect(gammaRow && alphaRow && gammaRow.displayOrder < alphaRow.displayOrder).toBe(true);
});

test("deux ordres identiques ne changent pas la révision si la séquence reste la même", async () => {
  await insertUser("dj-order");
  const category = await createCategoryForUser("dj-order", "Soirée");
  const first = await insertTrack("Un");
  const second = await insertTrack("Deux");
  if (!category.ok) {
    throw new Error("Catégorie attendue.");
  }
  const addedFirst = await addLocalTrackForUser("dj-order", category.data.categoryId, first.id);
  const addedSecond = await addLocalTrackForUser("dj-order", category.data.categoryId, second.id);
  if (!addedFirst.ok || !addedSecond.ok) {
    throw new Error("Associations attendues.");
  }

  await db
    .update(catalogTracks)
    .set({ displayOrder: 0 })
    .where(eq(catalogTracks.categoryId, category.data.categoryId));

  const before = await revisionOf("dj-order");
  const rowsBefore = await db
    .select({ id: catalogTracks.id, displayOrder: catalogTracks.displayOrder })
    .from(catalogTracks)
    .where(eq(catalogTracks.categoryId, category.data.categoryId))
    .orderBy(asc(catalogTracks.displayOrder), asc(catalogTracks.id));
  const earlier = rowsBefore[0];
  if (!earlier) {
    throw new Error("Morceau attendu.");
  }

  const result = await reorderCatalogTrackForUser("dj-order", earlier.id, "down");
  expect(result.ok && result.data.changed).toBe(false);
  expect(await revisionOf("dj-order")).toBe(before);

  const rowsAfter = await db
    .select({ id: catalogTracks.id, displayOrder: catalogTracks.displayOrder })
    .from(catalogTracks)
    .where(eq(catalogTracks.categoryId, category.data.categoryId))
    .orderBy(asc(catalogTracks.displayOrder), asc(catalogTracks.id));
  expect(rowsAfter).toEqual(rowsBefore);
});

test("une catégorie d'un autre DJ est introuvable et la clé composite tient", async () => {
  const catalogA = await insertUser("dj-a");
  await insertUser("dj-b");
  const category = await createCategoryForUser("dj-a", "Privée");
  const track = await insertTrack("Secret");
  if (!category.ok) {
    throw new Error("Catégorie attendue.");
  }
  const revisionA = await revisionOf("dj-a");
  const revisionB = await revisionOf("dj-b");

  const foreign = await addLocalTrackForUser("dj-b", category.data.categoryId, track.id);
  expect(foreign).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  expect(await revisionOf("dj-a")).toBe(revisionA);
  expect(await revisionOf("dj-b")).toBe(revisionB);
  expect(await db.select().from(catalogTracks)).toEqual([]);

  const categoryB = await createCategoryForUser("dj-b", "Autre");
  if (!categoryB.ok) {
    throw new Error("Catégorie B attendue.");
  }

  let code: string | undefined;
  try {
    await db.insert(catalogTracks).values({
      catalogId: catalogA.id,
      categoryId: categoryB.data.categoryId,
      musicTrackId: track.id,
      displayOrder: 0,
    });
  } catch (error) {
    let current: unknown = error;
    for (let depth = 0; depth < 6 && typeof current === "object" && current !== null; depth += 1) {
      if ("code" in current && typeof current.code === "string") {
        code = current.code;
        break;
      }
      current = "cause" in current ? current.cause : undefined;
    }
  }

  expect(code).toBe("23503");
});
