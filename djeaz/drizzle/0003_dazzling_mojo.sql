CREATE TABLE "catalog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "catalog_categories_id_catalog_id_unique" UNIQUE("id","catalog_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"music_track_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "catalog_tracks_catalog_id_music_track_id_unique" UNIQUE("catalog_id","music_track_id")
);
--> statement-breakpoint
CREATE TABLE "music_genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_track_genres" (
	"music_track_id" uuid NOT NULL,
	"music_genre_id" uuid NOT NULL,
	CONSTRAINT "music_track_genres_music_track_id_music_genre_id_pk" PRIMARY KEY("music_track_id","music_genre_id")
);
--> statement-breakpoint
CREATE TABLE "music_track_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"music_track_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"release_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "music_track_sources_provider_external_id_unique" UNIQUE("provider","external_id")
);
--> statement-breakpoint
CREATE TABLE "music_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"album_title" text,
	"artwork_url" text,
	"artwork_provider" text,
	"isrc" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "tracks";--> statement-breakpoint
DROP TABLE "genres";--> statement-breakpoint
ALTER TABLE "catalog_categories" ADD CONSTRAINT "catalog_categories_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_tracks" ADD CONSTRAINT "catalog_tracks_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_tracks" ADD CONSTRAINT "catalog_tracks_music_track_id_music_tracks_id_fk" FOREIGN KEY ("music_track_id") REFERENCES "public"."music_tracks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_tracks" ADD CONSTRAINT "catalog_tracks_category_catalog_fk" FOREIGN KEY ("category_id","catalog_id") REFERENCES "public"."catalog_categories"("id","catalog_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track_genres" ADD CONSTRAINT "music_track_genres_music_track_id_music_tracks_id_fk" FOREIGN KEY ("music_track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track_genres" ADD CONSTRAINT "music_track_genres_music_genre_id_music_genres_id_fk" FOREIGN KEY ("music_genre_id") REFERENCES "public"."music_genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track_sources" ADD CONSTRAINT "music_track_sources_music_track_id_music_tracks_id_fk" FOREIGN KEY ("music_track_id") REFERENCES "public"."music_tracks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_categories_catalog_id_idx" ON "catalog_categories" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "catalog_tracks_category_id_idx" ON "catalog_tracks" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "catalog_tracks_music_track_id_idx" ON "catalog_tracks" USING btree ("music_track_id");--> statement-breakpoint
CREATE INDEX "music_track_genres_music_genre_id_idx" ON "music_track_genres" USING btree ("music_genre_id");--> statement-breakpoint
CREATE INDEX "music_track_sources_music_track_id_idx" ON "music_track_sources" USING btree ("music_track_id");--> statement-breakpoint
ALTER TABLE "catalogs" DROP COLUMN "seed_version";