import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Локалізація контенту (uk/pl/en). Payload тримає localized-поля не в
 * основній таблиці, а в <collection>_locales (рядок на кожну мову).
 *
 *  products.title/color_name/description/description_html/size_chart_html/care_html
 *  categories.title
 *  media.alt
 *      → переносяться у *_locales з _locale = 'uk', старі колонки видаляються.
 *
 * Схема (назви таблиць/індексів/FK) знята з dev push на порожній БД —
 * не migrate:create (див. 20260917_210000_related_products.ts).
 * title у *_locales nullable: назва обов'язкова лише українською
 * (requiredInDefaultLocale), переклади можна не заповнювати.
 * Idempotent: повторний запуск нічого не ламає.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."_locales" AS ENUM('uk', 'pl', 'en');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "products_locales" (
      "title" varchar,
      "color_name" varchar,
      "description" varchar,
      "description_html" varchar,
      "size_chart_html" varchar,
      "care_html" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "categories_locales" (
      "title" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "media_locales" (
      "alt" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale", "_parent_id");
  `)

  // Перенос даних → uk. Лише якщо стара колонка ще існує (idempotent).
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'title') THEN
        INSERT INTO "products_locales"
          ("title", "color_name", "description", "description_html", "size_chart_html", "care_html", "_locale", "_parent_id")
        SELECT "title", "color_name", "description", "description_html", "size_chart_html", "care_html", 'uk', "id"
        FROM "products"
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'categories' AND column_name = 'title') THEN
        INSERT INTO "categories_locales" ("title", "_locale", "_parent_id")
        SELECT "title", 'uk', "id" FROM "categories"
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'media' AND column_name = 'alt') THEN
        INSERT INTO "media_locales" ("alt", "_locale", "_parent_id")
        SELECT "alt", 'uk', "id" FROM "media"
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    ALTER TABLE "products" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "color_name";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "description_html";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "size_chart_html";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "care_html";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "alt";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Повертаємо колонки і заповнюємо з uk. Переклади pl/en втрачаються.
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_name" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description_html" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_chart_html" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "care_html" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "alt" varchar;

    UPDATE "products" p SET
      "title" = l."title",
      "color_name" = l."color_name",
      "description" = l."description",
      "description_html" = l."description_html",
      "size_chart_html" = l."size_chart_html",
      "care_html" = l."care_html"
    FROM "products_locales" l
    WHERE l."_parent_id" = p."id" AND l."_locale" = 'uk';

    UPDATE "categories" c SET "title" = l."title"
    FROM "categories_locales" l
    WHERE l."_parent_id" = c."id" AND l."_locale" = 'uk';

    UPDATE "media" m SET "alt" = l."alt"
    FROM "media_locales" l
    WHERE l."_parent_id" = m."id" AND l."_locale" = 'uk';

    UPDATE "products" SET "title" = '' WHERE "title" IS NULL;
    UPDATE "categories" SET "title" = '' WHERE "title" IS NULL;
    ALTER TABLE "products" ALTER COLUMN "title" SET NOT NULL;
    ALTER TABLE "categories" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE IF EXISTS "products_locales" CASCADE;
    DROP TABLE IF EXISTS "categories_locales" CASCADE;
    DROP TABLE IF EXISTS "media_locales" CASCADE;
    DROP TYPE IF EXISTS "public"."_locales";
  `)
}
