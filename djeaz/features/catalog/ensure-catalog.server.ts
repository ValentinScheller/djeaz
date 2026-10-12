import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client.server";
import { catalogs } from "@/db/schema";

// L'unicité de `owner_id` protège deux créations simultanées.
// `ON CONFLICT DO NOTHING` n'écrit pas la ligne existante : `revision` reste intacte.
export async function ensureCatalogForUser(userId: string) {
  const [existing] = await db.select().from(catalogs).where(eq(catalogs.ownerId, userId));
  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(catalogs)
    .values({ ownerId: userId })
    .onConflictDoNothing({ target: catalogs.ownerId })
    .returning();

  if (inserted) {
    return inserted;
  }

  const [createdByOther] = await db.select().from(catalogs).where(eq(catalogs.ownerId, userId));
  if (!createdByOther) {
    throw new Error("Catalogue introuvable après un conflit d'unicité.");
  }

  return createdByOther;
}
