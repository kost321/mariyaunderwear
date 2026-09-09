import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Глобал Settings — спільні налаштування магазину.
 * Поки що одне поле: deliveryPaymentHtml (текст «Доставка та оплата»,
 * показується в акордеоні на сторінці кожного товару).
 *
 * Idempotent (IF NOT EXISTS) — безпечно застосовувати навіть якщо таблицю
 * вже створив db push у dev.
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
