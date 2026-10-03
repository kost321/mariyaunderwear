import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products.description: richText (jsonb) → HTML (varchar).
 *
 * The "Description" field returns to the UI as a plain HTML field (like descriptionHtml,
 * which is now called "Characteristics"). There is no old data in the column
 * (the field was hidden), so we simply change the type.
 *
 * USING NULL discards any leftover jsonb; idempotent via a
 * check of the current type.
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
