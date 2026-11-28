import { v2 as cloudinary } from 'cloudinary'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { isProductionSite } from './siteEnv'

/**
 * Staging and local dev use the same Cloudinary account as production. Their uploads go to a separate
 * folder, and deleting an image there removes only the database record: the file may be one that
 * production shows.
 */
const UPLOAD_FOLDER = isProductionSite() ? 'olga-shop' : 'olga-shop-dev'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function cloudinaryAdapter(): Adapter {
  return () => ({
    name: 'cloudinary',

    handleUpload: async ({ file }) => {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: UPLOAD_FOLDER, resource_type: 'image' },
            (error, result) => {
              if (error || !result) return reject(error)
              resolve(result)
            },
          )
          stream.end(file.buffer)
        },
      )
      return {
        url: result.secure_url,
        filename: result.public_id,
      }
    },

    handleDelete: async ({ doc }) => {
      if (!isProductionSite()) {
        console.info(`[cloudinary] not production: ${doc.filename} kept in Cloudinary`)
        return
      }
      if (doc.filename) {
        await cloudinary.uploader.destroy(doc.filename)
      }
    },

    generateURL: ({ filename }) => {
      return cloudinary.url(filename, { secure: true })
    },

    staticHandler: async (_req, { params: { filename } }) => {
      const url = cloudinary.url(filename, { secure: true })
      return Response.redirect(url, 302)
    },
  })
}
