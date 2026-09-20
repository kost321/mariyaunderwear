import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products.care_html — нове текстове поле «Догляд» (HTML), як
 * sizeChartHtml/descriptionHtml. Показується в акордеоні «Догляд»
 * на сторінці товару, порожнє — секція не показується.
 *
 * Написано вручну (не через migrate:create) — автогенератор порівнює
 * зі старим снапшотом і намагається зайво перестворити наявні колонки
 * (див. 20260917_210000_related_products.ts). Idempotent (IF NOT EXISTS).
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
