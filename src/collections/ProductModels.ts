import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * ProductModels: a product "model" (for example "Pearl Morning robe").
 *
 * One model groups several product cards, one per color.
 * Each color card is a separate product with its own slug, photos and description,
 * and the `model` field on the product points to the model it belongs to.
 * On the product page this gives the color switcher (see getColorVariants).
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
