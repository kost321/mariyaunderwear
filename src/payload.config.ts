import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Какой пользователь логинится в админку.
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Olga Shop',
    },
  },

  // Регистрируем все коллекции.
  collections: [Products, Categories, Orders, Media, Users],

  // Редактор richText по умолчанию (для описаний товаров).
  editor: lexicalEditor(),

  // Секрет для подписи токенов/cookie.
  secret: process.env.PAYLOAD_SECRET || '',

  // Куда генерировать TypeScript-типы из схемы коллекций.
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Адаптер базы данных — PostgreSQL.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  // sharp нужен для генерации превью изображений (imageSizes в Media).
  sharp,
})
