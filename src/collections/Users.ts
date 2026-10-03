import type { CollectionConfig } from 'payload'

/**
 * Users: store administrators.
 * auth: true turns the collection into an authenticated one:
 * Payload adds email/password fields, login at /admin,
 * password reset, etc. These are CMS users, NOT customers
 * (customers place orders without registering).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Налаштування',
  },
  labels: {
    singular: 'Користувач',
    plural: 'Користувачі',
  },
  access: {
    // Only logged-in CMS users can access the data.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      label: "Ім'я",
      type: 'text',
    },
    // The email and password fields are added automatically thanks to auth: true.
  ],
}
