import type { CollectionConfig } from 'payload'

/**
 * Users — администраторы магазина.
 * auth: true превращает коллекцию в аутентифицируемую:
 * Payload сам добавляет поля email/password, логин в /admin,
 * сброс пароля и т.д. Это пользователи CMS, а НЕ покупатели
 * (покупатели у нас оформляют заказ без регистрации).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Настройки',
  },
  labels: {
    singular: 'Пользователь',
    plural: 'Пользователи',
  },
  access: {
    // Доступ к данным имеют только залогиненные пользователи CMS.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
    },
    // Поля email и password добавляются автоматически благодаря auth: true.
  ],
}
