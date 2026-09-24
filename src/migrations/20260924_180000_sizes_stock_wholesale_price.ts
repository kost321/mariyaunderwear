import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products_sizes.stock — залишок на складі для конкретного розміру,
 * заповнюється імпортом із Торгсофт. products.wholesale_price — оптова
 * ціна, адмінське поле (не показується на сайті — обмежено field-level
 * access.read у Products.ts).
 *
 * Написано вручну (не через migrate:create), ідемпотентно (IF NOT EXISTS).
 * ПЕРЕД ЗАСТОСУВАННЯМ У ПРОД: звірити фактичну назву дочірньої таблиці
 * масиву sizes (products_sizes) і тип колонок проти реальної прод-схеми.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_sizes" ADD COLUMN IF NOT EXISTS "stock" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wholesale_price" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_sizes" DROP COLUMN IF EXISTS "stock";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "wholesale_price";
  `)
}
