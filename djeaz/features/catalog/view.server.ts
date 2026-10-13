import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client.server";
import { catalogCategories, catalogs, catalogTracks, musicTracks } from "@/db/schema";

import type { CatalogWorkspace } from "./types";

export async function loadCatalogWorkspace(userId: string): Promise<CatalogWorkspace> {
  const [catalog] = await db
    .select({ id: catalogs.id, revision: catalogs.revision })
    .from(catalogs)
    .where(eq(catalogs.ownerId, userId))
    .limit(1);

  if (!catalog) {
    return { revision: 0, categories: [] };
  }

  const categories = await db
    .select({
      id: catalogCategories.id,
      name: catalogCategories.name,
      displayOrder: catalogCategories.displayOrder,
    })
    .from(catalogCategories)
    .where(eq(catalogCategories.catalogId, catalog.id))
    .orderBy(asc(catalogCategories.displayOrder), asc(catalogCategories.id));

  const tracks = await db
    .select({
      associationId: catalogTracks.id,
      categoryId: catalogTracks.categoryId,
      musicTrackId: catalogTracks.musicTrackId,
      displayOrder: catalogTracks.displayOrder,
      title: musicTracks.title,
      artist: musicTracks.artist,
      albumTitle: musicTracks.albumTitle,
      disambiguation: musicTracks.disambiguation,
      artworkUrl: musicTracks.artworkUrl,
    })
    .from(catalogTracks)
    .innerJoin(musicTracks, eq(catalogTracks.musicTrackId, musicTracks.id))
    .where(eq(catalogTracks.catalogId, catalog.id))
    .orderBy(asc(catalogTracks.displayOrder), asc(catalogTracks.id));

  return {
    revision: catalog.revision,
    categories: categories.map((category) => ({
      ...category,
      tracks: tracks
        .filter((track) => track.categoryId === category.id)
        .map((track) => ({
          associationId: track.associationId,
          musicTrackId: track.musicTrackId,
          title: track.title,
          artist: track.artist,
          albumTitle: track.albumTitle,
          disambiguation: track.disambiguation,
          artworkUrl: track.artworkUrl,
          displayOrder: track.displayOrder,
        })),
    })),
  };
}
