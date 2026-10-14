import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'
import { requiredInDefaultLocale } from '@/lib/localization'

/**
 * Categories: product categories (for example "Dresses", "Jackets").
 * Fields: title, slug, image (per the spec).
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Каталог',
  },
  labels: {
    singular: 'Категорія',
    plural: 'Категорії',
  },
  access: {
    read: () => true, // read: () => true, // categories are public
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      label: 'Назва',
      type: 'text',
      localized: true,
      // Обов'язкова лише українською — див. requiredInDefaultLocale.
      validate: requiredInDefaultLocale,
      admin: {
        description: "Обов'язково українською. PL/EN — за бажанням: порожньо — на сайті буде українська назва.",
      },
    },
    {
      name: 'slug',
      label: 'URL (slug)',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Залиште порожнім — згенерується з назви.',
      },
      hooks: {
        // Before saving, normalize the slug to a URL-safe form.
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'image',
      label: 'Зображення категорії',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
