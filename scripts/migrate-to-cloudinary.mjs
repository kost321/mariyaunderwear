/**
 * Міграція локальних фото з public/media/ у Cloudinary.
 * Оновлює URL в базі даних через Payload API.
 *
 * Запуск: ADMIN_PASSWORD=123123 node scripts/migrate-to-cloudinary.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = path.join(__dirname, '../public/media')
const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kostyannn1996@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzbov07se',
  api_key: process.env.CLOUDINARY_API_KEY || '499113254224165',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'WhrHGkaE0E8iDM0JcJGH92cF1mQ',
})

function log(msg) { console.log(`[migrate] ${msg}`) }
function warn(msg) { console.warn(`[warn]   ${msg}`) }
function err(msg) { console.error(`[ERROR]  ${msg}`) }

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const data = await res.json()
  if (!data.token) { err(`Не вдалося увійти: ${JSON.stringify(data)}`); process.exit(1) }
  log(`Авторизовано як ${ADMIN_EMAIL}`)
  return data.token
}

async function getAllMediaDocs(token) {
  const res = await fetch(`${PAYLOAD_URL}/api/media?limit=200&depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const data = await res.json()
  return data.docs || []
}

async function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { public_id: publicId, folder: 'olga-shop', overwrite: false, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )
  })
}

async function updateMediaDoc(token, id, url, filename) {
  const res = await fetch(`${PAYLOAD_URL}/api/media/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, filename }),
  })
  return res.json()
}

async function main() {
  if (!ADMIN_PASSWORD) { err('Укажіть ADMIN_PASSWORD'); process.exit(1) }

  const token = await login()
  const docs = await getAllMediaDocs(token)
  log(`Медіа-записів у базі: ${docs.length}`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const doc of docs) {
    const originalFilename = doc.filename
    if (!originalFilename) { warn(`Запис ${doc.id} без filename, пропускаю`); skipped++; continue }

    // Якщо вже в Cloudinary — пропускаємо
    if (doc.url && doc.url.includes('cloudinary.com')) {
      log(`Вже в Cloudinary: ${originalFilename}`)
      skipped++
      continue
    }

    // Шукаємо файл локально (тільки оригінал, без ресайзів)
    const baseName = originalFilename.replace(/\.[^.]+$/, '')
    const ext = path.extname(originalFilename)
    // Оригінал — файл без суфіксу розміру (не містить -400x400 тощо)
    const localPath = path.join(MEDIA_DIR, originalFilename)

    if (!fs.existsSync(localPath)) {
      warn(`Файл не знайдено локально: ${localPath}`)
      skipped++
      continue
    }

    log(`Завантажую: ${originalFilename}`)

    try {
      const publicId = `olga-shop/${baseName}`
      const result = await uploadToCloudinary(localPath, baseName)
      const cloudUrl = result.secure_url

      // Оновлюємо запис у базі
      await updateMediaDoc(token, doc.id, cloudUrl, result.public_id)
      log(`  ✓ ${originalFilename} → ${cloudUrl}`)
      uploaded++
    } catch (e) {
      err(`  Помилка для ${originalFilename}: ${e.message}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\n─────────────────────────────')
  console.log(`Завантажено: ${uploaded}, Пропущено: ${skipped}, Помилок: ${failed}`)
  console.log('─────────────────────────────')
}

main().catch(e => { err(e.message); process.exit(1) })
