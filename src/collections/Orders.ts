import type { CollectionConfig } from 'payload'

/**
 * Orders: customer orders.
 *
 * Fields per the spec: customerName, phone, email, products, totalPrice, status.
 *
 * Decisions:
 *  - products: an array of line items. For each line we store a relationship
 *    to the product plus a snapshot (title, price, size, color, quantity) at
 *    the time of the order. The snapshot keeps the order correct even
 *    if the price changes or the product is deleted later.
 *  - totalPrice: recalculated on the server in beforeChange; the total
 *    sent by the client is NOT trusted.
 *  - status: select with fixed values new/processing/
 *    completed/cancelled.
 *  - orderNumber: a human-readable number generated on creation.
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
    // Orders are created only by the server route /api/order (Local API,
    // overrideAccess), so public REST/GraphQL creation is closed.
    create: ({ req }) => Boolean(req.user),
    // Only a CMS administrator can view or change orders.
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // 1. Order number: only on creation.
        if (operation === 'create' && !data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}`
        }
        // 2. Recalculate the total on the server from the line-item snapshots.
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
