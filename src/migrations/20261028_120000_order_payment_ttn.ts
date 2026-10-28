import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * orders: payment method chosen at checkout (payment_method), the manager's
 * "payment received" mark for prepayment (payment_received) and the Nova Poshta
 * waybill number (ttn).
 *
 * Written by hand (not via migrate:create), idempotent. The enum name follows
 * Payload's convention, like enum_orders_status in the initial migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('prepaid', 'cod');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" "enum_orders_payment_method";
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_received" boolean DEFAULT false;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ttn" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_method";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_received";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "ttn";
    DROP TYPE IF EXISTS "public"."enum_orders_payment_method";
  `)
}
