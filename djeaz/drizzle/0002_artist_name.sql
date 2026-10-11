ALTER TABLE "user" ADD COLUMN "artist_name" text;
--> statement-breakpoint
UPDATE "user" SET "artist_name" = "name" WHERE "artist_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "artist_name" SET NOT NULL;
