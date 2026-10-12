import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client.server";
import { catalogCategories, catalogs, catalogTracks } from "@/db/schema";

const NOT_FOUND_MESSAGE = "Introuvable.";

// PostgreSQL accepte un UUID hexadécimal 8-4-4-4-12. Un format invalide ne part pas
// en base : le résultat reste `NOT_FOUND`, sans erreur SQL distincte.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CatalogAccessResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: "NOT_FOUND"; message: string } };

type CatalogRow = typeof catalogs.$inferSelect;

type CategoryRow = {
  id: string;
  catalogId: string;
  name: string;
  displayOrder: number;
};

type CatalogTrackRow = {
  id: string;
  catalogId: string;
  categoryId: string;
  musicTrackId: string;
  displayOrder: number;
};

const categoryColumns = {
  id: catalogCategories.id,
  catalogId: catalogCategories.catalogId,
  name: catalogCategories.name,
  displayOrder: catalogCategories.displayOrder,
};

const catalogTrackColumns = {
  id: catalogTracks.id,
  catalogId: catalogTracks.catalogId,
  categoryId: catalogTracks.categoryId,
  musicTrackId: catalogTracks.musicTrackId,
  displayOrder: catalogTracks.displayOrder,
};

function notFound<T>(): CatalogAccessResult<T> {
  return { ok: false, error: { code: "NOT_FOUND", message: NOT_FOUND_MESSAGE } };
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

// `userId` est `session.user.id`, déjà obtenu côté serveur. Ces fonctions ne lisent
// ni en-tête, ni paramètre, ni corps. Le propriétaire est dans le WHERE : une ligne
// absente et une ligne d'un autre DJ ne renvoient aucune ligne, donc le même `NOT_FOUND`.
// `music_*` n'est pas lu : la bibliothèque globale n'a pas de propriétaire.

export async function getCatalogForUser(userId: string): Promise<CatalogAccessResult<CatalogRow>> {
  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.ownerId, userId)).limit(1);

  if (!catalog) {
    return notFound();
  }

  return { ok: true, data: catalog };
}

export async function getCategoryForUser(
  userId: string,
  categoryId: string,
): Promise<CatalogAccessResult<CategoryRow>> {
  if (!isUuid(categoryId)) {
    return notFound();
  }

  const [category] = await db
    .select(categoryColumns)
    .from(catalogCategories)
    .innerJoin(catalogs, eq(catalogCategories.catalogId, catalogs.id))
    .where(and(eq(catalogCategories.id, categoryId), eq(catalogs.ownerId, userId)))
    .limit(1);

  if (!category) {
    return notFound();
  }

  return { ok: true, data: category };
}

export async function listCategoriesForUser(userId: string): Promise<CategoryRow[]> {
  return db
    .select(categoryColumns)
    .from(catalogCategories)
    .innerJoin(catalogs, eq(catalogCategories.catalogId, catalogs.id))
    .where(eq(catalogs.ownerId, userId))
    .orderBy(asc(catalogCategories.displayOrder), asc(catalogCategories.id));
}

export async function getCatalogTrackForUser(
  userId: string,
  catalogTrackId: string,
): Promise<CatalogAccessResult<CatalogTrackRow>> {
  if (!isUuid(catalogTrackId)) {
    return notFound();
  }

  const [association] = await db
    .select(catalogTrackColumns)
    .from(catalogTracks)
    .innerJoin(catalogs, eq(catalogTracks.catalogId, catalogs.id))
    .where(and(eq(catalogTracks.id, catalogTrackId), eq(catalogs.ownerId, userId)))
    .limit(1);

  if (!association) {
    return notFound();
  }

  return { ok: true, data: association };
}

export async function listCatalogTracksForUser(userId: string): Promise<CatalogTrackRow[]> {
  return db
    .select(catalogTrackColumns)
    .from(catalogTracks)
    .innerJoin(catalogs, eq(catalogTracks.catalogId, catalogs.id))
    .where(eq(catalogs.ownerId, userId))
    .orderBy(asc(catalogTracks.displayOrder), asc(catalogTracks.id));
}
