/**
 * Скрипт импорта товаров из Tilda CSV в Payload CMS.
 *
 * Запуск:
 *   node scripts/import-tilda.mjs --file=scripts/data/komplekt.csv
 *
 * Перед запуском:
 *   1. Убедитесь что приложение запущено: npm run dev (или build)
 *   2. Положите CSV-файл из Tilda рядом со скриптом
 *   3. Укажите PAYLOAD_URL и admin credentials ниже или через .env
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Настройки ────────────────────────────────────────────────────────────────
const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kostyannn1996@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '' // заполните или передайте через env

const DEFAULT_CSV = path.join(__dirname, 'data', 'komplekt.csv')

// Маппинг цветов украинского → HEX
const COLOR_HEX = {
  'чорний': '#1a1a1a',
  'білий': '#ffffff',
  'бежевий': '#d4b896',
  'тілесний': '#e8c9a0',
  'червоний': '#cc0000',
  'рожевий': '#ff69b4',
  'пудровий': '#f2c4ce',
  'золотий': '#c8a85a',
  'срібний': '#a8a8a8',
  'синій': '#1a3a6b',
  'блакитний': '#87ceeb',
  'зелений': '#2d6a2d',
  'сірий': '#808080',
  'коричневий': '#8b4513',
  'фіолетовий': '#6a0dad',
  'бордовий': '#800020',
  'хакі': '#78866b',
  'леопард': '#c19a49',
}

// ─── Утиліти ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[import] ${msg}`) }
function warn(msg) { console.warn(`[warn]   ${msg}`) }
function err(msg)  { console.error(`[ERROR]  ${msg}`) }

function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.split('=').slice(1).join('=') : null
}

/**
 * Разбирает CSV с разделителем `;` и поддержкой кавычек.
 * Возвращает массив объектов { [header]: value }.
 */
function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0])

  return lines.slice(1).map(line => {
    const vals = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h.trim()] = (vals[i] || '').trim() })
    return row
  }).filter(r => Object.values(r).some(v => v))
}

function splitCsvLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ';' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

/**
 * Парсит поле Editions: "Колір:Чорний;Розмір:S"
 * Возвращает { color: 'Чорний', size: 'S' }
 */
function parseEditions(editions) {
  if (!editions) return {}
  const result = {}
  editions.split(';').forEach(part => {
    const [key, val] = part.split(':').map(s => s.trim())
    if (!key || !val) return
    const keyLower = key.toLowerCase()
    if (keyLower.includes('колір') || keyLower.includes('цвет') || keyLower.includes('color')) {
      result.color = val
    } else if (keyLower.includes('розмір') || keyLower.includes('размер') || keyLower.includes('size')) {
      result.size = val
    }
  })
  return result
}

function toHex(colorName) {
  if (!colorName) return null
  return COLOR_HEX[colorName.toLowerCase()] || null
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[іїєё]/g, c => ({ 'і': 'i', 'ї': 'yi', 'є': 'ye', 'ё': 'yo' })[c] || c)
    .replace(/[а-яёА-ЯЁ]/g, c => {
      const m = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',
        л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',
        ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
      return m[c.toLowerCase()] || c
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Payload API ──────────────────────────────────────────────────────────────

let authToken = null

async function login() {
  if (!ADMIN_PASSWORD) {
    err('Укажите ADMIN_PASSWORD через env или прямо в скрипте')
    process.exit(1)
  }
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const data = await res.json()
  if (!data.token) {
    err(`Не удалось войти: ${JSON.stringify(data)}`)
    process.exit(1)
  }
  authToken = data.token
  log(`Авторизован как ${ADMIN_EMAIL}`)
}

function authHeaders(extra = {}) {
  return { Authorization: `JWT ${authToken}`, ...extra }
}

async function findOrCreateCategory(title) {
  const slug = slugify(title)
  // Поиск по slug
  const searchRes = await fetch(
    `${PAYLOAD_URL}/api/categories?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
    { headers: authHeaders() }
  )
  const searchData = await searchRes.json()
  if (searchData.docs && searchData.docs.length > 0) {
    return searchData.docs[0].id
  }
  // Создание
  const createRes = await fetch(`${PAYLOAD_URL}/api/categories`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, slug }),
  })
  const created = await createRes.json()
  if (created.doc) {
    log(`Создана категория: ${title}`)
    return created.doc.id
  }
  throw new Error(`Не удалось создать категорию "${title}": ${JSON.stringify(created)}`)
}

/**
 * Скачивает изображение по URL и загружает в Media.
 * Возвращает ID медиа-записи.
 */
async function uploadImageFromUrl(imageUrl, altText = '') {
  // Проверяем что уже не загружено (по alt/filename)
  const filename = path.basename(new URL(imageUrl).pathname)
  const checkRes = await fetch(
    `${PAYLOAD_URL}/api/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`,
    { headers: authHeaders() }
  )
  const checkData = await checkRes.json()
  if (checkData.docs && checkData.docs.length > 0) {
    log(`  Фото уже есть: ${filename}`)
    return checkData.docs[0].id
  }

  // Скачиваем
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) {
    warn(`  Не удалось скачать фото: ${imageUrl} (${imgRes.status})`)
    return null
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg'
  const safeFilename = filename.endsWith('.jpg') || filename.endsWith('.png') || filename.endsWith('.webp')
    ? filename
    : filename + ext

  // Загружаем в Payload Media (нативный FormData Node 18+)
  const form = new FormData()
  const blob = new Blob([buffer], { type: contentType })
  form.append('file', blob, safeFilename)
  form.append('alt', altText || safeFilename)

  const uploadRes = await fetch(`${PAYLOAD_URL}/api/media`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const uploaded = await uploadRes.json()
  if (uploaded.doc) {
    log(`  Загружено фото: ${safeFilename}`)
    return uploaded.doc.id
  }
  warn(`  Ошибка загрузки фото ${safeFilename}: ${JSON.stringify(uploaded).slice(0, 200)}`)
  return null
}

async function productExists(title) {
  // Перевіряємо тільки по точній назві
  const byTitle = await fetch(
    `${PAYLOAD_URL}/api/products?where[title][equals]=${encodeURIComponent(title)}&limit=1`,
    { headers: authHeaders() }
  ).then(r => r.json())
  return byTitle.docs?.length > 0
}

async function createProduct(productData) {
  const res = await fetch(`${PAYLOAD_URL}/api/products`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(productData),
  })
  const data = await res.json()
  if (data.doc) return data.doc

  // Якщо конфлікт SKU — спробуємо без SKU (використовуємо унікальний slug)
  const skuConflict = JSON.stringify(data).includes('"sku"')
  if (skuConflict && productData.sku) {
    const fallback = { ...productData, sku: undefined, slug: `${productData.slug}-${Date.now()}` }
    const res2 = await fetch(`${PAYLOAD_URL}/api/products`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(fallback),
    })
    const data2 = await res2.json()
    if (data2.doc) return data2.doc
    throw new Error(`Ошибка создания товара: ${JSON.stringify(data2).slice(0, 300)}`)
  }

  throw new Error(`Ошибка создания товара: ${JSON.stringify(data).slice(0, 300)}`)
}

// ─── Основная логика ──────────────────────────────────────────────────────────

async function main() {
  const csvPath = getArg('file') || DEFAULT_CSV

  if (!fs.existsSync(csvPath)) {
    err(`CSV файл не найден: ${csvPath}`)
    err(`Использование: node scripts/import-tilda.mjs --file=путь/к/файлу.csv`)
    process.exit(1)
  }

  log(`Читаю CSV: ${csvPath}`)
  const content = fs.readFileSync(csvPath, 'utf8')
  const rows = parseCsv(content)
  log(`Строк в CSV: ${rows.length}`)

  // Группируем: родители (нет Parent UID) и дети (есть Parent UID)
  const parents = rows.filter(r => !r['Parent UID'] || r['Parent UID'] === '')
  const children = rows.filter(r => r['Parent UID'] && r['Parent UID'] !== '')

  log(`Товаров (родители): ${parents.length}`)
  log(`Вариантов (дети): ${children.length}`)

  // Индекс детей по Parent UID
  const childrenByParent = {}
  for (const child of children) {
    const pid = child['Parent UID']
    if (!childrenByParent[pid]) childrenByParent[pid] = []
    childrenByParent[pid].push(child)
  }

  await login()

  let created = 0
  let skipped = 0
  let failed = 0

  for (const parent of parents) {
    const tildaUid = parent['Tilda UID']
    const title = parent['Title'] || ''
    // SKU берём из родителя, или из первого варианта (Tilda хранит его там)
    const variants0 = childrenByParent[tildaUid] || []
    const sku = parent['SKU'] || variants0[0]?.['SKU'] || parent['External ID'] || tildaUid || ''

    if (!title) {
      warn(`Пропускаю строку без Title (UID: ${tildaUid})`)
      skipped++
      continue
    }

    log(`\nОбрабатываю: ${title}`)

    // Slug генерируем заранее для проверки дубликата
    const baseSlug = slugify(title)
    const slug = sku ? `${baseSlug}-${sku}` : baseSlug

    // Проверка на дубликат по title и SKU
    if (await productExists(title)) {
      warn(`Товар уже существует, пропускаю: ${title}`)
      skipped++
      continue
    }

    // Категория (берём первую из списка через ";")
    const categoryRaw = (parent['Category'] || 'Комплект').split(';')[0].trim()
    let categoryId
    try {
      categoryId = await findOrCreateCategory(categoryRaw)
    } catch (e) {
      err(`Не удалось создать категорию для "${title}": ${e.message}`)
      failed++
      continue
    }

    // Варианты этого товара
    const variants = variants0

    // Цена — берём минимальную из вариантов (или из родителя)
    const prices = variants
      .map(v => parseFloat(v['Price']))
      .filter(p => !isNaN(p) && p > 0)
    const price = prices.length > 0
      ? Math.min(...prices)
      : parseFloat(parent['Price']) || 0

    if (price === 0) {
      warn(`Товар "${title}" без цены — пропускаю`)
      skipped++
      continue
    }

    // Размеры и цвета из вариантов
    const sizesSet = new Set()
    const colorsMap = new Map() // name → hex

    for (const variant of variants) {
      const { color, size } = parseEditions(variant['Editions'])
      if (size) sizesSet.add(size)
      if (color && !colorsMap.has(color)) {
        colorsMap.set(color, toHex(color))
      }
    }

    const sizes = Array.from(sizesSet).map(value => ({ value }))
    const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
      name,
      ...(hex ? { hex } : {}),
    }))

    // Фотографии — из родителя (space-separated) + первое фото каждого варианта
    const photoStr = parent['Photo'] || ''
    const parentPhotos = photoStr.split(' ').map(u => u.trim()).filter(Boolean)

    // Убираем дубли
    const allPhotoUrls = [...new Set(parentPhotos)]

    log(`  Фото: ${allPhotoUrls.length}, Размеры: ${sizes.length}, Цвета: ${colors.length}, Цена: ${price}`)

    // Загружаем фото
    const imageIds = []
    for (const url of allPhotoUrls) {
      const mediaId = await uploadImageFromUrl(url, title)
      if (mediaId) imageIds.push({ image: mediaId })
    }

    if (imageIds.length === 0) {
      warn(`  Нет фотографий для "${title}" — товар будет без изображений`)
    }

    const productPayload = {
      title,
      slug,
      sku: sku || undefined,
      price,
      category: categoryId,
      active: true,
      ...(imageIds.length > 0 ? { images: imageIds } : {}),
      ...(sizes.length > 0 ? { sizes } : {}),
      ...(colors.length > 0 ? { colors } : {}),
    }

    try {
      const doc = await createProduct(productPayload)
      log(`  ✓ Создан товар: ${doc.title} (id: ${doc.id})`)
      created++
    } catch (e) {
      err(`  Ошибка создания "${title}": ${e.message}`)
      failed++
    }

    // Пауза чтобы не перегружать сервер
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\n─────────────────────────────')
  console.log(`Готово! Создано: ${created}, Пропущено: ${skipped}, Ошибок: ${failed}`)
  console.log('─────────────────────────────')
}

main().catch(e => {
  err(e.message)
  process.exit(1)
})
