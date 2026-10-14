import type { CollectionConfig } from 'payload'

/**
 * Media: uploaded images (product photos, category pictures).
 * upload: {...} enables file uploads. Payload:
 *  - stores the original in the staticDir folder (public/media);
 *  - generates previews of the given sizes via sharp;
 *  - serves files at the URL /media/<name>.
 *
 * Products and categories reference Media through a relationship,
 * so it works as a reusable media library.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Каталог',
  },
  labels: {
    singular: 'Зображення',
    plural: 'Медіа',
  },
  access: {
    // Store images must be visible to all site visitors.
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
    adminThumbnail: ({ doc }) => {
      const filename = doc.filename as string
      if (!filename) return ''
      const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'dzbov07se'
      return `https://res.cloudinary.com/${cloud}/image/upload/w_400,h_400,c_fill/${filename}`
    },
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt-текст (для SEO та доступності)',
      type: 'text',
    },
  ],
}
