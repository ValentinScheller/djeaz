import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

// Suppression de compte non décidée (P7.5) : un utilisateur qui a un catalogue ne peut pas être supprimé.
// L'unicité (id, catalog_id) sert de cible à la clé étrangère composite de catalog_tracks.
// Supprimer une catégorie retire ses associations. Aucune association ne supprime un morceau global.
export const catalogs = pgTable("catalogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "restrict" }),
  revision: integer("revision").notNull().default(0),
});

export const musicTracks = pgTable("music_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumTitle: text("album_title"),
  artworkUrl: text("artwork_url"),
  artworkProvider: text("artwork_provider"),
  isrc: text("isrc"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const musicTrackSources = pgTable(
  "music_track_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    musicTrackId: uuid("music_track_id")
      .notNull()
      .references(() => musicTracks.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    releaseId: text("release_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("music_track_sources_provider_external_id_unique").on(table.provider, table.externalId),
    index("music_track_sources_music_track_id_idx").on(table.musicTrackId),
  ],
);

export const musicGenres = pgTable("music_genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const musicTrackGenres = pgTable(
  "music_track_genres",
  {
    musicTrackId: uuid("music_track_id")
      .notNull()
      .references(() => musicTracks.id, { onDelete: "cascade" }),
    musicGenreId: uuid("music_genre_id")
      .notNull()
      .references(() => musicGenres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.musicTrackId, table.musicGenreId] }),
    index("music_track_genres_music_genre_id_idx").on(table.musicGenreId),
  ],
);

export const catalogCategories = pgTable(
  "catalog_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catalogId: uuid("catalog_id")
      .notNull()
      .references(() => catalogs.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    unique("catalog_categories_id_catalog_id_unique").on(table.id, table.catalogId),
    index("catalog_categories_catalog_id_idx").on(table.catalogId),
  ],
);

export const catalogTracks = pgTable(
  "catalog_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catalogId: uuid("catalog_id")
      .notNull()
      .references(() => catalogs.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id").notNull(),
    musicTrackId: uuid("music_track_id")
      .notNull()
      .references(() => musicTracks.id, { onDelete: "restrict" }),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    unique("catalog_tracks_catalog_id_music_track_id_unique").on(
      table.catalogId,
      table.musicTrackId,
    ),
    foreignKey({
      columns: [table.categoryId, table.catalogId],
      foreignColumns: [catalogCategories.id, catalogCategories.catalogId],
      name: "catalog_tracks_category_catalog_fk",
    }).onDelete("cascade"),
    index("catalog_tracks_category_id_idx").on(table.categoryId),
    index("catalog_tracks_music_track_id_idx").on(table.musicTrackId),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    fingerprint: text("fingerprint").notNull(),
    operation: text("operation").notNull(),
    count: integer("count").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.fingerprint, table.operation] }),
    index("rate_limits_expires_at_idx").on(table.expiresAt),
  ],
);

export const catalogRelations = relations(catalogs, ({ one, many }) => ({
  owner: one(user, {
    fields: [catalogs.ownerId],
    references: [user.id],
  }),
  categories: many(catalogCategories),
  tracks: many(catalogTracks),
}));

export const musicTrackRelations = relations(musicTracks, ({ many }) => ({
  sources: many(musicTrackSources),
  genres: many(musicTrackGenres),
  catalogTracks: many(catalogTracks),
}));

export const musicTrackSourceRelations = relations(musicTrackSources, ({ one }) => ({
  musicTrack: one(musicTracks, {
    fields: [musicTrackSources.musicTrackId],
    references: [musicTracks.id],
  }),
}));

export const musicGenreRelations = relations(musicGenres, ({ many }) => ({
  tracks: many(musicTrackGenres),
}));

export const musicTrackGenreRelations = relations(musicTrackGenres, ({ one }) => ({
  musicTrack: one(musicTracks, {
    fields: [musicTrackGenres.musicTrackId],
    references: [musicTracks.id],
  }),
  musicGenre: one(musicGenres, {
    fields: [musicTrackGenres.musicGenreId],
    references: [musicGenres.id],
  }),
}));

export const catalogCategoryRelations = relations(catalogCategories, ({ one, many }) => ({
  catalog: one(catalogs, {
    fields: [catalogCategories.catalogId],
    references: [catalogs.id],
  }),
  tracks: many(catalogTracks),
}));

export const catalogTrackRelations = relations(catalogTracks, ({ one }) => ({
  catalog: one(catalogs, {
    fields: [catalogTracks.catalogId],
    references: [catalogs.id],
  }),
  category: one(catalogCategories, {
    fields: [catalogTracks.categoryId],
    references: [catalogCategories.id],
  }),
  musicTrack: one(musicTracks, {
    fields: [catalogTracks.musicTrackId],
    references: [musicTracks.id],
  }),
}));
