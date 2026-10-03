import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Settings global: shared store settings.
 * One field for now: deliveryPaymentHtml (the "Delivery and payment" text,
 * shown in the accordion on every product page).
 *
 * Idempotent (IF NOT EXISTS), so it is safe to apply even if the table
 * was already created by db push in dev.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "delivery_payment_html" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "settings";
  `)
}
