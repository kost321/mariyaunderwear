import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * Products: store products.
 *
 * Fields per the spec: title, slug, description, price, images, category,
 * sizes, colors, sku, active.
 *
 * Modeling decisions:
 *  - images: an array of upload fields -> image gallery.
 *  - sizes: an array of strings (S/M/L or 42/44), stored as a sub-collection
 *    of rows; the client adds the values they need in the admin.
 *  - colors: an array of {name, hex} objects -> a color swatch can be shown.
 *  - category: a relationship to the categories collection.
 *  - active: a checkbox: whether to show the product in the catalog.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'category', 'active'],
    group: 'Каталог',
  },
  labels: {
    singular: 'Товар',
    plural: 'Товари',
  },
  access: {
    // Public read is allowed, but frontend queries additionally
    // filter by active=true.
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
      name: 'active',
      label: 'Активний (показувати в каталозі)',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      label: 'Ціна, ₴',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        step: 1,
      },
    },
    {
      name: 'sku',
      label: 'Артикул (SKU)',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Може повторюватися — напр. у різних кольорів однієї моделі однаковий артикул.',
      },
    },
    {
      name: 'wholesalePrice',
      label: 'Оптова ціна, ₴',
      type: 'number',
      min: 0,
      admin: {
        step: 1,
        position: 'sidebar',
        description: 'Внутрішнє поле для адмінки. Не показується на сайті.',
      },
      access: {
        // The public frontend reads products without authentication (the collection's
        // access.read allows everyone), so this field is restricted to logged-in
        // CMS admins, so the wholesale price never reaches the public API.
        read: ({ req }) => Boolean(req.user),
      },
    },
    {
      name: 'category',
      label: 'Категорія',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'model',
      label: 'Модель',
      type: 'relationship',
      relationTo: 'product-models',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Оберіть модель, щоб зв\'язати цей колір з іншими кольорами того самого товару. Порожньо — товар без варіантів кольору. Моделі створюються у розділі «Каталог → Моделі».',
      },
    },
    {
      name: 'colorName',
      label: 'Назва цього кольору',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Напр. "Молочний". Показується у перемикачі кольорів.',
      },
    },
    {
      name: 'colorHex',
      label: 'HEX-код цього кольору',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Напр. #f3e9dd — колір кружечка у перемикачі.',
      },
    },
    {
      type: 'collapsible',
      label: 'Опис',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'description',
          label: 'Опис',
          type: 'textarea',
          admin: {
            description:
              'Опис товару у форматі HTML — абзаци <p>…</p>, списки <ul><li>…</li></ul>, таблиці. Показується в акордеоні «Опис» на сторінці товару. Порожньо — секція не показується.',
            rows: 12,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Характеристика',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'descriptionHtml',
          label: 'Характеристика',
          type: 'textarea',
          admin: {
            description:
              'Характеристики товару у форматі HTML — текст, списки, таблиця <table>…</table>. Показується в акордеоні «Характеристика» на сторінці товару. Порожньо — секція не показується.',
            rows: 12,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Розмірна таблиця',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'sizeChartHtml',
          label: 'Розмірна таблиця (HTML)',
          type: 'textarea',
          admin: {
            description:
              'Готовий HTML з таблицею розмірів для цього товару. На сторінці товару поруч із вибором розміру з\'явиться посилання «Розмірна таблиця», яке відкриває це у модальному вікні. Порожньо — посилання не показується.',
            rows: 12,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Догляд',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'careHtml',
          label: 'Догляд',
          type: 'textarea',
          admin: {
            description:
              'Рекомендації з догляду за товаром у форматі HTML — абзаци <p>…</p>, списки <ul><li>…</li></ul>. Показується в акордеоні «Догляд» на сторінці товару. Порожньо — секція не показується.',
            rows: 12,
          },
        },
      ],
    },
    {
      name: 'images',
      label: 'Галерея зображень',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Зображення',
        plural: 'Зображення',
      },
      fields: [
        {
          name: 'image',
          label: 'Файл',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'sizes',
      label: 'Доступні розміри',
      type: 'array',
      labels: { singular: 'Розмір', plural: 'Розміри' },
      fields: [
        {
          name: 'value',
          label: 'Розмір',
          type: 'text',
          required: true,
        },
        {
          name: 'stock',
          label: 'Залишок (шт.)',
          type: 'number',
          min: 0,
          admin: {
            description: 'Заповнюється імпортом із Торгсофт.',
          },
        },
      ],
    },
    {
      name: 'colors',
      label: 'Доступні кольори',
      type: 'array',
      labels: { singular: 'Колір', plural: 'Кольори' },
      fields: [
        {
          name: 'name',
          label: 'Назва кольору',
          type: 'text',
          required: true,
        },
        {
          name: 'hex',
          label: 'HEX-код (наприклад, #1a1a1a)',
          type: 'text',
        },
      ],
    },
    {
      name: 'relatedProducts',
      label: 'Схожі товари',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description:
          'Оберіть товари, які показуватимуться в блоці «Схожі товари» на сторінці цього товару. Порожньо — блок не показується.',
      },
    },
  ],
}
