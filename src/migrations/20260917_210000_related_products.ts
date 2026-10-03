import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Products.relatedProducts: a self-referencing relationship (hasMany):
 * a staff member hand-picks products for the "Similar products" block.
 *
 * Written by hand (not via migrate:create): the generator compares the
 * current schema snapshot with products_id_1234.json, which does not match
 * the actual state of the production products table (verified with pg_dump from
 * the real prod database), and tries to needlessly recreate columns that already exist
 * and drop the nonexistent color_group. products_rels is the only
 * new table this field needs, so the migration is limited to it.
 *
 * Idempotent (IF NOT EXISTS), so it is safe to apply even if
 * the table was already created by db push in dev.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "products_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_rels";
  `)
}
