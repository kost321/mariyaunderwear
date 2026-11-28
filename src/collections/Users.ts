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
  auth: {
    // Payload's default is 5 attempts and then a 10-minute lock, which kept locking
    // the owner out over typos. Fully disabling the lock would leave the admin open
    // to password guessing (login has no other rate limit), so it is softened:
    // 10 attempts, then a 1-minute pause.
    maxLoginAttempts: 10,
    lockTime: 60 * 1000,
  },
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
