import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Materials reference list and the products.materials relationship (hasMany).
 *
 * - materials: a new collection (title, slug, show_on_home, sort_order, image).
 * - products_rels.materials_id: Payload stores hasMany relationships in _rels.
 * - payload_locked_documents_rels.materials_id: lock table link to the new collection.
 *
 * Written by hand (not via migrate:create), idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "materials" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "show_on_home" boolean DEFAULT false,
      "sort_order" numeric,
      "image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "materials" ADD CONSTRAINT "materials_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE UNIQUE INDEX IF NOT EXISTS "materials_title_idx" ON "materials" USING btree ("title");
    CREATE UNIQUE INDEX IF NOT EXISTS "materials_slug_idx" ON "materials" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "materials_image_idx" ON "materials" USING btree ("image_id");
    CREATE INDEX IF NOT EXISTS "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "materials_created_at_idx" ON "materials" USING btree ("created_at");

    ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "materials_id" integer;
    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_materials_fk"
        FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "products_rels_materials_id_idx" ON "products_rels" USING btree ("materials_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "materials_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk"
        FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_materials_id_idx"
      ON "payload_locked_documents_rels" USING btree ("materials_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_materials_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_materials_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "materials_id";

    ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_materials_fk";
    DROP INDEX IF EXISTS "products_rels_materials_id_idx";
    ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "materials_id";

    DROP TABLE IF EXISTS "materials";
  `)
}
