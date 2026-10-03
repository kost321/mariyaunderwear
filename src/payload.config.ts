import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { buildConfig } from 'payload'
import { uk } from '@payloadcms/translations/languages/uk'
import sharp from 'sharp'
import { cloudinaryAdapter } from './lib/cloudinaryAdapter'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { ProductModels } from './collections/ProductModels'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Settings } from './globals/Settings'
import { torgsoftImportHandler } from './lib/torgsoftImportEndpoint'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Which collection users log into the admin with.
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Mariya Underwear',
    },
    components: {
      views: {
        torgsoftImport: {
          Component: '/src/admin/torgsoft-import/TorgsoftImportView#TorgsoftImportView',
          path: '/torgsoft-import',
        },
      },
      afterNavLinks: ['/src/admin/torgsoft-import/TorgsoftNavLink#TorgsoftNavLink'],
    },
  },

  i18n: {
    supportedLanguages: { uk },
    fallbackLanguage: 'uk',
  },

  // Register all collections.
  collections: [Products, ProductModels, Categories, Orders, Media, Users],

  // Global store settings.
  globals: [Settings],

  // Custom API endpoints (served through /app/(payload)/api/[...slug]).
  endpoints: [
    {
      path: '/torgsoft-import',
      method: 'post',
      handler: torgsoftImportHandler,
    },
  ],

  // Default richText editor (for product descriptions).
  editor: lexicalEditor(),

  // Secret used to sign tokens/cookies.
  secret: process.env.PAYLOAD_SECRET || '',

  // Where to generate TypeScript types from the collection schema.
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Database adapter: PostgreSQL.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
    // push syncs the schema with the collections automatically, but does so
    // at its own discretion. In production this caused the _rels tables to drift
    // out of sync (cascading product DELETE failed). Therefore:
    //   dev  - push is on, convenient for local development;
    //   prod - push is off, ONLY migrations manage the schema (scripts/start.sh
    //          → payload migrate).
    push: process.env.NODE_ENV !== 'production',
  }),

  // sharp is needed to generate image previews (imageSizes in Media).
  sharp,

  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter(),
          disableLocalStorage: true,
          generateFileURL: ({ filename }) =>
            `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`,
        },
      },
    }),
  ],
})
