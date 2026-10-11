import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Columns added by the Payload 3.85 → 3.90 upgrade (found by diffing the schema
 * that each version pushes into an empty database):
 * - media._objectKey: new field of @payloadcms/plugin-cloud-storage;
 * - users.reset_password_requested_at: new auth field of Payload.
 *
 * Written by hand (not via migrate:create), idempotent (IF NOT EXISTS).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
  `)
}
