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
    singular: 'Заказ',
    plural: 'Заказы',
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
      label: 'Номер заказа',
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
        { label: 'Новый', value: 'new' },
        { label: 'В обработке', value: 'processing' },
        { label: 'Выполнен', value: 'completed' },
        { label: 'Отменён', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerName',
      label: 'Имя покупателя',
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
      label: 'Комментарий к заказу',
      type: 'textarea',
    },
    {
      name: 'products',
      label: 'Состав заказа',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Позиция', plural: 'Позиции' },
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
          label: 'Название (снимок)',
          type: 'text',
        },
        {
          name: 'priceSnapshot',
          label: 'Цена на момент заказа, ₽',
          type: 'number',
          required: true,
        },
        {
          name: 'size',
          label: 'Размер',
          type: 'text',
        },
        {
          name: 'color',
          label: 'Цвет',
          type: 'text',
        },
        {
          name: 'quantity',
          label: 'Количество',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'totalPrice',
      label: 'Итого, ₽',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Считается автоматически на сервере.',
      },
    },
  ],
}
