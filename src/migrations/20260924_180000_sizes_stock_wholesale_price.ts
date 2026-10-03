import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products_sizes.stock: stock in the warehouse for a specific size,
 * filled by the Torgsoft import. products.wholesale_price: the wholesale
 * price, an admin field (not shown on the site; restricted by field-level
 * access.read in Products.ts).
 *
 * Written by hand (not via migrate:create), idempotent (IF NOT EXISTS).
 * BEFORE APPLYING TO PROD: check the actual name of the child table of the
 * sizes array (products_sizes) and the column types against the real prod schema.
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
