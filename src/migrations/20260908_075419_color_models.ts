import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Цветовые варианты товара через коллекцию «Моделі».
 *
 * - product_models — новая коллекция (модель = «Халат Перлинний ранок»).
 * - products.model_id — relationship на модель; связывает карточки цветов.
 * - products.color_name / color_hex — подпись и цвет кружка в переключателе.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_models" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "product_models_slug_idx" ON "product_models" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "product_models_updated_at_idx" ON "product_models" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_models_created_at_idx" ON "product_models" USING btree ("created_at");

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "model_id" integer;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_name" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_hex" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description_html" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_chart_html" varchar;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_model_id_product_models_id_fk"
        FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "products_model_idx" ON "products" USING btree ("model_id");

    -- SKU больше не уникален: у разных цветов одной модели один артикул.
    DROP INDEX IF EXISTS "products_sku_idx";

    -- Служебная таблица блокировки документов: связь с новой коллекцией.
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_models_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_models_fk"
        FOREIGN KEY ("product_models_id") REFERENCES "product_models"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_models_id_idx"
      ON "payload_locked_documents_rels" USING btree ("product_models_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_models_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_models_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_models_id";

    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_model_id_product_models_id_fk";
    DROP INDEX IF EXISTS "products_model_idx";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "model_id";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "color_name";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "color_hex";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "description_html";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "size_chart_html";
    CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_idx" ON "products" USING btree ("sku");
    DROP TABLE IF EXISTS "product_models";
  `)
}
