import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * materials.care_text: short care advice for a fabric, shown on the home page
 * fabric cards (over the photo on hover, under the name on touch screens).
 *
 * Written by hand (not via migrate:create), idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "care_text" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "materials" DROP COLUMN IF EXISTS "care_text";
  `)
}
