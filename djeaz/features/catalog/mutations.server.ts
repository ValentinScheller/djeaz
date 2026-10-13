import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { catalogCategories, catalogs, catalogTracks, musicTracks } from "@/db/schema";
import {
  persistCanonicalRecording,
  withMusicTransaction,
  type MusicTx,
} from "@/features/music/persist.server";
import type { ExternalRecording } from "@/features/music/types";
import { actionError, type ActionFailure, type ActionResult } from "@/lib/action-result";

const NOT_FOUND_MESSAGE = "Introuvable.";
const CONFLICT_MESSAGE = "Ce morceau est déjà dans votre catalogue.";
const CATEGORY_MESSAGE = "Saisissez un nom de 1 à 80 caractères.";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const categoryNameSchema = z.string().trim().min(1).max(80);

export class CatalogTransactionError extends Error {
  readonly failure: ActionFailure;

  constructor(failure: ActionFailure) {
    super(failure.error.code);
    this.name = "CatalogTransactionError";
    this.failure = failure;
  }
}

export type CatalogChange = {
  changed: boolean;
};

function notFound(): never {
  throw new CatalogTransactionError(actionError("NOT_FOUND", NOT_FOUND_MESSAGE));
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function internalFailure(error: unknown): ActionFailure {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const name = error instanceof Error ? error.name : "unknown";
  console.error(`[catalog] ${id} ${name}`);
  return actionError(
    "INTERNAL_ERROR",
    `Une erreur inattendue est survenue. Réessayez. Identifiant : ${id}`,
  );
}

function asCatalogFailure(error: unknown): ActionFailure {
  if (error instanceof CatalogTransactionError) {
    return error.failure;
  }
  return internalFailure(error);
}

async function lockCatalog(tx: MusicTx, userId: string) {
  const [catalog] = await tx
    .select({ id: catalogs.id, revision: catalogs.revision })
    .from(catalogs)
    .where(eq(catalogs.ownerId, userId))
    .for("update");

  if (!catalog) {
    notFound();
  }

  return catalog;
}

async function bumpRevision(tx: MusicTx, catalogId: string): Promise<void> {
  await tx
    .update(catalogs)
    .set({ revision: sql`${catalogs.revision} + 1` })
    .where(eq(catalogs.id, catalogId));
}

async function requireCategory(tx: MusicTx, catalogId: string, categoryId: string) {
  if (!isUuid(categoryId)) {
    notFound();
  }

  const [category] = await tx
    .select({ id: catalogCategories.id })
    .from(catalogCategories)
    .where(and(eq(catalogCategories.id, categoryId), eq(catalogCategories.catalogId, catalogId)))
    .limit(1);

  if (!category) {
    notFound();
  }

  return category;
}

async function nextNumber(
  tx: MusicTx,
  column: typeof catalogCategories.displayOrder | typeof catalogTracks.displayOrder,
  where: ReturnType<typeof eq> | ReturnType<typeof and>,
): Promise<number> {
  const [row] = await tx
    .select({ value: sql<number>`coalesce(max(${column}), -1)` })
    .from(column === catalogCategories.displayOrder ? catalogCategories : catalogTracks)
    .where(where);

  return Number(row?.value ?? -1) + 1;
}

async function run<T>(operation: (tx: MusicTx) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await withMusicTransaction(operation);
    return { ok: true, data };
  } catch (error) {
    return asCatalogFailure(error);
  }
}

export async function createCategoryForUser(
  userId: string,
  name: string,
): Promise<ActionResult<CatalogChange & { categoryId: string }>> {
  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", CATEGORY_MESSAGE, { name: CATEGORY_MESSAGE });
  }

  return run(async (tx) => {
    const catalog = await lockCatalog(tx, userId);
    const displayOrder = await nextNumber(
      tx,
      catalogCategories.displayOrder,
      eq(catalogCategories.catalogId, catalog.id),
    );
    const [created] = await tx
      .insert(catalogCategories)
      .values({ catalogId: catalog.id, name: parsed.data, displayOrder })
      .returning({ id: catalogCategories.id });

    if (!created) {
      throw new Error("Catégorie non créée.");
    }

    await bumpRevision(tx, catalog.id);
    return { categoryId: created.id, changed: true };
  });
}

export async function deleteCategoryForUser(
  userId: string,
  categoryId: string,
): Promise<ActionResult<CatalogChange>> {
  return run(async (tx) => {
    const catalog = await lockCatalog(tx, userId);
    const category = await requireCategory(tx, catalog.id, categoryId);

    await tx
      .delete(catalogTracks)
      .where(
        and(eq(catalogTracks.catalogId, catalog.id), eq(catalogTracks.categoryId, category.id)),
      );

    const deleted = await tx
      .delete(catalogCategories)
      .where(
        and(eq(catalogCategories.id, category.id), eq(catalogCategories.catalogId, catalog.id)),
      )
      .returning({ id: catalogCategories.id });

    if (deleted.length === 0) {
      notFound();
    }

    await bumpRevision(tx, catalog.id);
    return { changed: true };
  });
}

async function attachTrack(
  tx: MusicTx,
  userId: string,
  categoryId: string,
  musicTrackId: string,
): Promise<CatalogChange & { associationId: string; musicTrackId: string }> {
  const catalog = await lockCatalog(tx, userId);
  await requireCategory(tx, catalog.id, categoryId);

  if (!isUuid(musicTrackId)) {
    notFound();
  }

  const [music] = await tx
    .select({ id: musicTracks.id })
    .from(musicTracks)
    .where(eq(musicTracks.id, musicTrackId))
    .limit(1);

  if (!music) {
    notFound();
  }

  const [existing] = await tx
    .select({ id: catalogTracks.id })
    .from(catalogTracks)
    .where(
      and(eq(catalogTracks.catalogId, catalog.id), eq(catalogTracks.musicTrackId, musicTrackId)),
    )
    .limit(1);

  if (existing) {
    throw new CatalogTransactionError(actionError("CONFLICT", CONFLICT_MESSAGE));
  }

  const displayOrder = await nextNumber(
    tx,
    catalogTracks.displayOrder,
    and(eq(catalogTracks.catalogId, catalog.id), eq(catalogTracks.categoryId, categoryId)),
  );

  const [created] = await tx
    .insert(catalogTracks)
    .values({
      catalogId: catalog.id,
      categoryId,
      musicTrackId,
      displayOrder,
    })
    .returning({ id: catalogTracks.id });

  if (!created) {
    throw new Error("Association non créée.");
  }

  await bumpRevision(tx, catalog.id);
  return { associationId: created.id, musicTrackId, changed: true };
}

export async function addLocalTrackForUser(
  userId: string,
  categoryId: string,
  musicTrackId: string,
): Promise<ActionResult<CatalogChange & { associationId: string; musicTrackId: string }>> {
  return run((tx) => attachTrack(tx, userId, categoryId, musicTrackId));
}

export async function addCanonicalRecordingToCategory(
  userId: string,
  categoryId: string,
  recording: ExternalRecording,
  artworkUrl: string | null,
): Promise<ActionResult<CatalogChange & { associationId: string; musicTrackId: string }>> {
  return run(async (tx) => {
    const musicTrackId = await persistCanonicalRecording(tx, recording, artworkUrl);
    return attachTrack(tx, userId, categoryId, musicTrackId);
  });
}

async function requireAssociation(tx: MusicTx, catalogId: string, associationId: string) {
  if (!isUuid(associationId)) {
    notFound();
  }

  const [association] = await tx
    .select({
      id: catalogTracks.id,
      categoryId: catalogTracks.categoryId,
      musicTrackId: catalogTracks.musicTrackId,
      displayOrder: catalogTracks.displayOrder,
    })
    .from(catalogTracks)
    .where(and(eq(catalogTracks.id, associationId), eq(catalogTracks.catalogId, catalogId)))
    .limit(1);

  if (!association) {
    notFound();
  }

  return association;
}

export async function removeCatalogTrackForUser(
  userId: string,
  associationId: string,
): Promise<ActionResult<CatalogChange & { musicTrackId: string }>> {
  return run(async (tx) => {
    const catalog = await lockCatalog(tx, userId);
    const association = await requireAssociation(tx, catalog.id, associationId);
    await tx.delete(catalogTracks).where(eq(catalogTracks.id, association.id));
    await bumpRevision(tx, catalog.id);
    return { musicTrackId: association.musicTrackId, changed: true };
  });
}

export async function moveCatalogTrackForUser(
  userId: string,
  associationId: string,
  targetCategoryId: string,
): Promise<ActionResult<CatalogChange>> {
  return run(async (tx) => {
    const catalog = await lockCatalog(tx, userId);
    const association = await requireAssociation(tx, catalog.id, associationId);
    await requireCategory(tx, catalog.id, targetCategoryId);

    if (association.categoryId === targetCategoryId) {
      return { changed: false };
    }

    const displayOrder = await nextNumber(
      tx,
      catalogTracks.displayOrder,
      and(eq(catalogTracks.catalogId, catalog.id), eq(catalogTracks.categoryId, targetCategoryId)),
    );

    await tx
      .update(catalogTracks)
      .set({ categoryId: targetCategoryId, displayOrder })
      .where(eq(catalogTracks.id, association.id));
    await bumpRevision(tx, catalog.id);
    return { changed: true };
  });
}

export async function reorderCatalogTrackForUser(
  userId: string,
  associationId: string,
  direction: "up" | "down",
): Promise<ActionResult<CatalogChange>> {
  if (direction !== "up" && direction !== "down") {
    return actionError("VALIDATION_ERROR", "Déplacement invalide.");
  }

  return run(async (tx) => {
    const catalog = await lockCatalog(tx, userId);
    const association = await requireAssociation(tx, catalog.id, associationId);
    const tracks = await tx
      .select({ id: catalogTracks.id, displayOrder: catalogTracks.displayOrder })
      .from(catalogTracks)
      .where(
        and(
          eq(catalogTracks.catalogId, catalog.id),
          eq(catalogTracks.categoryId, association.categoryId),
        ),
      )
      .orderBy(asc(catalogTracks.displayOrder), asc(catalogTracks.id));

    const index = tracks.findIndex((track) => track.id === association.id);
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = tracks[neighborIndex];
    const current = tracks[index];
    if (index < 0 || !neighbor || !current) {
      return { changed: false };
    }

    const nextOrders = new Map(tracks.map((track) => [track.id, track.displayOrder]));
    nextOrders.set(current.id, neighbor.displayOrder);
    nextOrders.set(neighbor.id, current.displayOrder);
    if (current.displayOrder === neighbor.displayOrder) {
      nextOrders.set(current.id, index);
      nextOrders.set(neighbor.id, neighborIndex);
    }

    const before = tracks.map((track) => track.id);
    const after = [...tracks]
      .sort((left, right) => {
        const delta = (nextOrders.get(left.id) ?? 0) - (nextOrders.get(right.id) ?? 0);
        if (delta !== 0) {
          return delta;
        }
        return left.id < right.id ? -1 : 1;
      })
      .map((track) => track.id);
    if (before.every((id, position) => id === after[position])) {
      return { changed: false };
    }

    await tx
      .update(catalogTracks)
      .set({ displayOrder: nextOrders.get(current.id) ?? current.displayOrder })
      .where(eq(catalogTracks.id, current.id));
    await tx
      .update(catalogTracks)
      .set({ displayOrder: nextOrders.get(neighbor.id) ?? neighbor.displayOrder })
      .where(eq(catalogTracks.id, neighbor.id));

    await bumpRevision(tx, catalog.id);
    return { changed: true };
  });
}
