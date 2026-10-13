"use server";

import { refresh } from "next/cache";

import { getAuthenticatedSession } from "@/features/auth/session.server";
import { actionError, type ActionResult } from "@/lib/action-result";

import type { CatalogChange } from "./mutations.server";

// Imports différés : charger ces actions pendant `next build` ne doit pas ouvrir la base.

async function requireUserId(): Promise<ActionResult<{ userId: string }>> {
  const session = await getAuthenticatedSession();
  if (!session.ok) {
    return actionError("UNAUTHENTICATED", session.error.message);
  }

  return { ok: true, data: { userId: session.data.user.id } };
}

function publish<T extends { changed: boolean }>(result: ActionResult<T>): ActionResult<T> {
  if (result.ok && result.data.changed) {
    refresh();
  }

  return result;
}

export async function createCategoryAction(
  name: string,
): Promise<ActionResult<CatalogChange & { categoryId: string }>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { createCategoryForUser } = await import("./mutations.server");
  return publish(await createCategoryForUser(session.data.userId, name));
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<ActionResult<CatalogChange>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { deleteCategoryForUser } = await import("./mutations.server");
  return publish(await deleteCategoryForUser(session.data.userId, categoryId));
}

export async function addLocalTrackAction(
  categoryId: string,
  musicTrackId: string,
): Promise<ActionResult<CatalogChange & { associationId: string }>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { addLocalTrackForUser } = await import("./mutations.server");
  return publish(await addLocalTrackForUser(session.data.userId, categoryId, musicTrackId));
}

export async function addExternalTrackAction(
  categoryId: string,
  recordingId: string,
): Promise<ActionResult<CatalogChange & { associationId: string }>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { selectExternalRecording } = await import("./external.server");
  return publish(await selectExternalRecording(session.data.userId, categoryId, recordingId));
}

export async function removeCatalogTrackAction(
  associationId: string,
): Promise<ActionResult<CatalogChange>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { removeCatalogTrackForUser } = await import("./mutations.server");
  const result = await removeCatalogTrackForUser(session.data.userId, associationId);
  if (!result.ok) {
    return result;
  }

  return publish({ ok: true, data: { changed: result.data.changed } });
}

export async function moveCatalogTrackAction(
  associationId: string,
  targetCategoryId: string,
): Promise<ActionResult<CatalogChange>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { moveCatalogTrackForUser } = await import("./mutations.server");
  return publish(
    await moveCatalogTrackForUser(session.data.userId, associationId, targetCategoryId),
  );
}

export async function reorderCatalogTrackAction(
  associationId: string,
  direction: "up" | "down",
): Promise<ActionResult<CatalogChange>> {
  const session = await requireUserId();
  if (!session.ok) {
    return session;
  }

  const { reorderCatalogTrackForUser } = await import("./mutations.server");
  return publish(await reorderCatalogTrackForUser(session.data.userId, associationId, direction));
}
