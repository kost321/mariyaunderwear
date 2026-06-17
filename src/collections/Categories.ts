import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * Categories — категории товаров (например: «Платья», «Куртки»).
 * Поля: title, slug, image (по ТЗ).
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Каталог',
  },
  labels: {
    singular: 'Категория',
    plural: 'Категории',
  },
  access: {
    read: () => true, // категории публичны
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'URL (slug)',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Оставьте пустым — сгенерируется из названия.',
      },
      hooks: {
        // Перед сохранением приводим slug к URL-безопасному виду.
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'image',
      label: 'Изображение категории',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
