import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Products.relatedProducts — relationship (hasMany) на саму себе:
 * співробітник вручну обирає товари для блоку «Схожі товари».
 *
 * Написано вручну (не через migrate:create): автогенератор порівнює
 * поточний снапшот схеми з products_id_1234.json, який не відповідає
 * фактичному стану продової таблиці products (перевірено pg_dump зі
 * справжньої prod-бази) — і намагається зайво перестворити вже наявні
 * колонки та видалити неіснуючу color_group. products_rels — єдина
 * нова таблиця, потрібна для цього поля, тому міграція обмежена нею.
 *
 * Idempotent (IF NOT EXISTS) — безпечно застосовувати навіть якщо
 * таблицю вже створив db push у dev.
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
