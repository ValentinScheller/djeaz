import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

// Suppression de compte non décidée (P7.5) : un utilisateur qui a un catalogue ne peut pas être supprimé.
// Vider un catalogue retire les genres, pas la ligne `catalogs` : pas de cascade depuis le catalogue.
// P6 supprime les morceaux avec leur genre : cascade genre → tracks.
export const catalogs = pgTable("catalogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "restrict" }),
  // Format de version fixé en P2.5.
  seedVersion: text("seed_version").notNull(),
  revision: integer("revision").notNull().default(0),
});

export const genres = pgTable(
  "genres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catalogId: uuid("catalog_id")
      .notNull()
      .references(() => catalogs.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [index("genres_catalog_id_idx").on(table.catalogId)],
);

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [index("tracks_genre_id_idx").on(table.genreId)],
);

// Une ligne par empreinte et opération. `expires_at` ferme la fenêtre et sert à la purge.
// L'empreinte n'est pas une adresse IP.
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
  genres: many(genres),
}));

export const genreRelations = relations(genres, ({ one, many }) => ({
  catalog: one(catalogs, {
    fields: [genres.catalogId],
    references: [catalogs.id],
  }),
  tracks: many(tracks),
}));

export const trackRelations = relations(tracks, ({ one }) => ({
  genre: one(genres, {
    fields: [tracks.genreId],
    references: [genres.id],
  }),
}));
