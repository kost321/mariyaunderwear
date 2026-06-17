import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slug'

/**
 * Products — товары магазина.
 *
 * Поля по ТЗ: title, slug, description, price, images, category,
 * sizes, colors, sku, active.
 *
 * Решения по моделированию:
 *  - images: массив upload-полей -> галерея изображений.
 *  - sizes: массив строк (S/M/L или 42/44). Хранятся как подколлекция
 *    строк — клиент добавляет нужные значения в админке.
 *  - colors: массив объектов {name, hex} -> можно показать кружок цвета.
 *  - category: relationship на коллекцию categories.
 *  - active: чекбокс — показывать ли товар в каталоге.
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
    plural: 'Товары',
  },
  access: {
    // Читать можно публично, но в запросах фронта мы дополнительно
    // фильтруем по active=true.
    read: () => true,
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
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'active',
      label: 'Активен (показывать в каталоге)',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      label: 'Цена, ₽',
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
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      label: 'Категория',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'richText',
    },
    {
      name: 'images',
      label: 'Галерея изображений',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Изображение',
        plural: 'Изображения',
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
      label: 'Доступные размеры',
      type: 'array',
      labels: { singular: 'Размер', plural: 'Размеры' },
      fields: [
        {
          name: 'value',
          label: 'Размер',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'colors',
      label: 'Доступные цвета',
      type: 'array',
      labels: { singular: 'Цвет', plural: 'Цвета' },
      fields: [
        {
          name: 'name',
          label: 'Название цвета',
          type: 'text',
          required: true,
        },
        {
          name: 'hex',
          label: 'HEX-код (например, #1a1a1a)',
          type: 'text',
        },
      ],
    },
  ],
}
