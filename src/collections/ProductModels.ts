import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * ProductModels — «модель» товару (наприклад: «Халат Перлинний ранок»).
 *
 * Одна модель об'єднує кілька карток товару — по одній на кожен колір.
 * Кожна картка кольору — окремий товар зі своїм slug, фото та описом,
 * а поле `model` у товарі вказує, до якої моделі він належить.
 * На сторінці товару це дає перемикач кольорів (див. getColorVariants).
 */
export const ProductModels: CollectionConfig = {
  slug: 'product-models',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Каталог',
    description:
      'Модель об\'єднує кольори одного товару. Спочатку створіть модель, потім у кожній картці кольору оберіть її в полі «Модель».',
  },
  labels: {
    singular: 'Модель',
    plural: 'Моделі',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      label: 'Назва моделі',
      type: 'text',
      required: true,
      admin: {
        description: 'Напр. «Халат Перлинний ранок». Покупцям не показується.',
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
        beforeValidate: [formatSlug('title')],
      },
    },
  ],
}
