import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products.description: richText (jsonb) → HTML (varchar).
 *
 * Поле «Опис» повертається у UI як звичайне HTML-поле (як descriptionHtml,
 * що тепер зветься «Характеристика»). Старих даних у колонці немає
 * (поле було приховане), тому просто змінюємо тип.
 *
 * USING NULL — відкидаємо будь-який залишковий jsonb; idempotent через
 * перевірку поточного типу.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'description'
          AND data_type = 'jsonb'
      ) THEN
        ALTER TABLE "products" ALTER COLUMN "description" TYPE varchar USING NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'description'
          AND data_type = 'character varying'
      ) THEN
        ALTER TABLE "products" ALTER COLUMN "description" TYPE jsonb USING NULL;
      END IF;
    END $$;
  `)
}
