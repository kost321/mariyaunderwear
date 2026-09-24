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
    singular: 'Зображення',
    plural: 'Медіа',
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
    adminThumbnail: ({ doc }) => {
      const filename = doc.filename as string
      if (!filename) return ''
      const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'dzbov07se'
      return `https://res.cloudinary.com/${cloud}/image/upload/w_400,h_400,c_fill/${filename}`
    },
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt-текст (для SEO та доступності)',
      type: 'text',
      localized: true,
    },
  ],
}
