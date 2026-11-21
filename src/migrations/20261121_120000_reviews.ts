import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Reviews collection (collections/Reviews.ts).
 *
 * - reviews: the table with its three select enums (status, source, fit), links to products and media.
 * - payload_locked_documents_rels.reviews_id: lock table link to the new collection.
 *
 * Written by hand (not via migrate:create) after `payload generate:db-schema`, idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_reviews_source" AS ENUM('site', 'instagram', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_reviews_fit" AS ENUM('small', 'fits', 'large');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "enum_reviews_status" DEFAULT 'approved' NOT NULL,
      "source" "enum_reviews_source" DEFAULT 'instagram' NOT NULL,
      "show_on_home" boolean DEFAULT false,
      "author_name" varchar NOT NULL,
      "product_id" integer,
      "rating" numeric,
      "text" varchar,
      "size" varchar,
      "fit" "enum_reviews_fit",
      "screenshot_id" integer,
      "link" varchar,
      "reply" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_screenshot_id_media_id_fk"
        FOREIGN KEY ("screenshot_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "reviews_product_idx" ON "reviews" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "reviews_screenshot_idx" ON "reviews" USING btree ("screenshot_id");
    CREATE INDEX IF NOT EXISTS "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "reviews_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk"
        FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx"
      ON "payload_locked_documents_rels" USING btree ("reviews_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_reviews_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_reviews_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reviews_id";

    DROP TABLE IF EXISTS "reviews";
    DROP TYPE IF EXISTS "public"."enum_reviews_fit";
    DROP TYPE IF EXISTS "public"."enum_reviews_source";
    DROP TYPE IF EXISTS "public"."enum_reviews_status";
  `)
}
