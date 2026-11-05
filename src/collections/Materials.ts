import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * Materials: fabric reference list (шовк, бавовна, мікромасло…).
 * Products link to it (Products.materials); the catalog filters by it, and
 * materials with "showOnHome" + image fill the fabric block on the home page.
 * The Torgsoft import creates missing materials from the "Матеріал" column.
 */
export const Materials: CollectionConfig = {
  slug: 'materials',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'showOnHome', 'sortOrder'],
    group: 'Каталог',
  },
  labels: {
    singular: 'Матеріал',
    plural: 'Матеріали',
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      label: 'Назва',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Напр. "Шовк", "Бавовна". Показується на сторінці товару та у фільтрі каталогу.' },
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
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'showOnHome',
      label: 'Показувати на головній (блок «Догляд за виробами»)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      label: 'Порядок',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Менше число — вище у фільтрі та раніше на головній.',
      },
    },
    {
      name: 'image',
      label: 'Фото тканини',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => Boolean(data?.showOnHome),
        description: 'Для картки на головній сторінці. Краще без тексту на фото — назва виводиться окремо.',
      },
    },
    {
      name: 'careText',
      label: 'Догляд',
      type: 'textarea',
      admin: {
        // Only relevant for the home page block, so shown only when the card is on the home page
        condition: (data) => Boolean(data?.showOnHome),
        rows: 4,
        description:
          'Коротко, 2–3 речення, напр. "Ручне прання до 30°. Не віджимати. Прасувати з виворіту." На головній з\'являється поверх фото при наведенні мишкою, на телефоні — під назвою тканини.',
      },
    },
  ],
}
