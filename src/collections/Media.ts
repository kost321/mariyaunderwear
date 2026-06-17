import type { CollectionConfig } from 'payload'

/**
 * Media — загруженные изображения (фото товаров, картинки категорий).
 * upload: {...} включает файловые загрузки. Payload:
 *  - сохраняет оригинал в папку staticDir (public/media);
 *  - генерирует превью указанных размеров через sharp;
 *  - отдаёт файлы по URL /media/<имя>.
 *
 * На товарах и категориях мы ссылаемся на Media через relationship —
 * это переиспользуемая медиатека.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Каталог',
  },
  labels: {
    singular: 'Изображение',
    plural: 'Медиа',
  },
  access: {
    // Картинки магазина должны быть видны всем посетителям сайта.
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'full',
        width: 1600,
        height: undefined,
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt-текст (для SEO и доступности)',
      type: 'text',
    },
  ],
}
