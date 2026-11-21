import type { CollectionConfig } from 'payload'

/**
 * Reviews: customer reviews shown on the product page and on the home page.
 *
 * Two ways in:
 *  - the form on the product page (`/api/review`): saved with source "site" and status "pending",
 *    the owner gets an email and publishes or rejects it here;
 *  - added by hand by the manager, e.g. from Instagram (a screenshot of a direct message or a story).
 *
 * The public sees only published reviews (access.read). Only site reviews with a rating count toward
 * the stars in Google (aggregateRating on the product page): Google expects ratings collected on the site.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'rating', 'product', 'source', 'status', 'createdAt'],
    group: 'Магазин',
    description:
      'Відгуки з форми на сайті приходять зі статусом «На перевірці» — на сайті вони зʼявляться, коли ви змініть статус на «Опубліковано».',
  },
  labels: {
    singular: 'Відгук',
    plural: 'Відгуки',
  },
  defaultSort: '-createdAt',
  access: {
    // Visitors see only published reviews; the admin sees all of them
    read: ({ req }) => (req.user ? true : { status: { equals: 'approved' } }),
    // Customers send reviews only through /api/review (validation, rate limit, status "pending")
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      required: true,
      // Added by hand in the admin = already checked; the site form sets "pending" itself
      defaultValue: 'approved',
      options: [
        { label: 'На перевірці', value: 'pending' },
        { label: 'Опубліковано', value: 'approved' },
        { label: 'Відхилено', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      label: 'Звідки відгук',
      type: 'select',
      required: true,
      defaultValue: 'instagram',
      options: [
        { label: 'Форма на сайті', value: 'site' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Інше (телефон, пошта)', value: 'other' },
      ],
      // "Site" means "left through the form", and only such ratings go into the Google stars, so it is
      // never offered by hand: a site review keeps "site", every other one chooses between the rest
      filterOptions: ({ data, options }) => {
        const isSite = (o: (typeof options)[number]) => (typeof o === 'string' ? o : o.value) === 'site'
        return data?.source === 'site' ? options.filter(isSite) : options.filter((o) => !isSite(o))
      },
      hooks: {
        // The same rule on the server (REST API included): "site" is set only by /api/review, which runs
        // without a logged-in user, and it cannot be switched on or off afterwards
        beforeChange: [
          ({ value, originalDoc, operation, req }) => {
            if (operation === 'create') return req.user && value === 'site' ? 'other' : value
            if (originalDoc?.source === 'site') return 'site'
            return value === 'site' ? (originalDoc?.source ?? 'other') : value
          },
        ],
      },
      admin: {
        position: 'sidebar',
        description: '«Форма на сайті» ставиться сама, коли відгук приходить із сайту. Вручну її обрати не можна.',
      },
    },
    {
      name: 'showOnHome',
      label: 'Показувати на головній',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Блок «Відгуки» на головній. Якщо не відмічено жодного — там показуються останні опубліковані.',
      },
    },
    {
      name: 'authorName',
      label: 'Імʼя',
      type: 'text',
      required: true,
      admin: { description: 'Як підписати відгук на сайті: імʼя або нік в Instagram.' },
    },
    {
      name: 'product',
      label: 'Товар',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        description:
          'Відгук показується на сторінці цього товару і всіх його кольорів. Порожньо — відгук про магазин загалом (тільки на головній).',
      },
    },
    {
      name: 'rating',
      label: 'Оцінка (1–5)',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        step: 1,
        description: 'Для відгуків з Instagram можна не ставити — тоді зірки не показуються.',
      },
    },
    {
      name: 'text',
      label: 'Текст відгуку',
      type: 'textarea',
      admin: { rows: 5 },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'size',
          label: 'Розмір, який купили',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'fit',
          label: 'Як сів розмір',
          type: 'select',
          options: [
            { label: 'Маломірить', value: 'small' },
            { label: 'В розмір', value: 'fits' },
            { label: 'Великомірить', value: 'large' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'screenshot',
      label: 'Скриншот',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.source !== 'site',
        description:
          'Скриншот повідомлення чи сторіс. Перед завантаженням замажте імʼя, фото профілю й номер телефону, якщо людина не погодилась їх показувати.',
      },
    },
    {
      name: 'link',
      label: 'Посилання на пост',
      type: 'text',
      admin: {
        condition: (data) => data?.source === 'instagram',
        description: 'Необовʼязково: якщо відгук — публічний пост або коментар.',
      },
    },
    {
      name: 'reply',
      label: 'Відповідь магазину',
      type: 'textarea',
      admin: {
        rows: 3,
        description: 'Необовʼязково. Показується під відгуком.',
      },
    },
  ],
}
