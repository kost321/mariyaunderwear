import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products.care_html: a new text field "Care" (HTML), like
 * sizeChartHtml/descriptionHtml. Shown in the "Care" accordion
 * on the product page; if empty, the section is not shown.
 *
 * Written by hand (not via migrate:create): the generator compares against
 * the old snapshot and tries to needlessly recreate existing columns
 * (see 20260917_210000_related_products.ts). Idempotent (IF NOT EXISTS).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "care_html" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "care_html";
  `)
}
