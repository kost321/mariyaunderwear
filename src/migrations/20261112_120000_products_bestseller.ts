import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products: the "Бестселер" checkbox (bestseller). The owner ticks products by hand;
 * they make up the «Бестселери» section of the catalog (/catalog?bestseller=1).
 *
 * Written by hand (not via migrate:create), idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bestseller" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "bestseller";
  `)
}
