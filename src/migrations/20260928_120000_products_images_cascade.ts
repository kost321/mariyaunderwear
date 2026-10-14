import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products_images.image_id is NOT NULL, but the FK to media was ON DELETE SET NULL:
 * deleting an image that is in a product gallery failed on the not-null
 * constraint and rolled back the whole transaction (bulk delete in "Media" did not
 * work). Changing to ON DELETE CASCADE: deleting an image removes only the
 * gallery row; the product itself is untouched.
 *
 * Written by hand (not via migrate:create), changes no data. Any
 * existing FK products_images(image_id) -> media is dropped by fact, not by
 * name, so we do not depend on the constraint name in the prod schema.
 * WARNING: Payload still considers the rule SET NULL in its schema; the next
 * migrate:create may try to revert it; that must be removed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE c record;
    BEGIN
      FOR c IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att
          ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
        WHERE con.contype = 'f'
          AND con.conrelid = 'public.products_images'::regclass
          AND con.confrelid = 'public.media'::regclass
          AND att.attname = 'image_id'
      LOOP
        EXECUTE format('ALTER TABLE "products_images" DROP CONSTRAINT %I', c.conname);
      END LOOP;
    END $$;

    ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_images" DROP CONSTRAINT IF EXISTS "products_images_image_id_media_id_fk";
    ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}
