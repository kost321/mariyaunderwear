import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * products_images.image_id — NOT NULL, але FK на media був ON DELETE SET NULL:
 * видалення картинки, що стоїть у галереї товару, падало на not-null
 * constraint і відкочувало всю транзакцію (масове видалення в «Медіа» не
 * працювало). Міняємо на ON DELETE CASCADE — разом із картинкою зникає лише
 * рядок галереї, сам товар не чіпається.
 *
 * Написано вручну (не через migrate:create), даних не змінює. Будь-який
 * наявний FK products_images(image_id) -> media видаляємо за фактом, а не за
 * назвою, щоб не залежати від назви констрейнта в прод-схемі.
 * УВАГА: Payload у своїй схемі й далі вважає правило SET NULL — наступний
 * migrate:create може спробувати повернути його назад; таке треба прибрати.
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
