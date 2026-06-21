import type { CollectionConfig } from 'payload'

/**
 * Orders — заказы покупателей.
 *
 * Поля по ТЗ: customerName, phone, email, products, totalPrice, status.
 *
 * Решения:
 *  - products: массив позиций. Для каждой позиции храним relationship
 *    на товар + снимок (название, цена, размер, цвет, количество) на
 *    момент заказа. Снимок нужен, чтобы заказ остался корректным, даже
 *    если позже изменят цену или удалят товар.
 *  - totalPrice: пересчитывается на сервере в beforeChange — НЕ доверяем
 *    сумме, пришедшей с клиента.
 *  - status: select с фиксированными значениями new/processing/
 *    completed/cancelled.
 *  - orderNumber: человекочитаемый номер, генерируется при создании.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'totalPrice', 'status', 'createdAt'],
    group: 'Магазин',
  },
  labels: {
    singular: 'Замовлення',
    plural: 'Замовлення',
  },
  access: {
    // Создание заказа доступно публично (покупатель не залогинен).
    create: () => true,
    // Просматривать/менять заказы может только администратор CMS.
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // 1. Номер заказа — только при создании.
        if (operation === 'create' && !data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}`
        }
        // 2. Пересчёт суммы на сервере по снимкам позиций.
        if (Array.isArray(data.products)) {
          data.totalPrice = data.products.reduce(
            (sum: number, item: { priceSnapshot?: number; quantity?: number }) =>
              sum + (item.priceSnapshot ?? 0) * (item.quantity ?? 1),
            0,
          )
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      label: 'Номер замовлення',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'Новий', value: 'new' },
        { label: 'В обробці', value: 'processing' },
        { label: 'Виконано', value: 'completed' },
        { label: 'Скасовано', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerName',
      label: "Ім'я покупця",
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      label: 'Телефон',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
    },
    {
      name: 'comment',
      label: 'Коментар до замовлення',
      type: 'textarea',
    },
    {
      name: 'products',
      label: 'Склад замовлення',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Позиція', plural: 'Позиції' },
      fields: [
        {
          name: 'product',
          label: 'Товар',

          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'titleSnapshot',
          label: 'Назва (знімок)',
          type: 'text',
        },
        {
          name: 'priceSnapshot',
          label: 'Ціна на момент замовлення, ₴',
          type: 'number',
          required: true,
        },
        {
          name: 'size',
          label: 'Розмір',
          type: 'text',
        },
        {
          name: 'color',
          label: 'Колір',
          type: 'text',
        },
        {
          name: 'quantity',
          label: 'Кількість',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'totalPrice',
      label: 'Разом, ₴',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Розраховується автоматично на сервері.',
      },
    },
  ],
}
