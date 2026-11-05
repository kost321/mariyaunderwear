import type { Payload } from 'payload'
import * as XLSX from 'xlsx'

/**
 * Import of prices/stock from a Torgsoft export (Excel/CSV) into Payload products.
 *
 * File: one row = one combination of Article + Color + Size, with its own
 * Quantity. Retail price / Wholesale price are the same for all rows of one
 * Article. The key for matching a product on the site is Article (sku) + Color
 * (colorName): each such Product document gets a new `sizes` array
 * built entirely from the current file (sizes with Quantity=0, or absent
 * from the file for that pair altogether, do not appear in the new array).
 *
 * The optional "Матеріал" column sets products.materials: values are split into
 * parts ("мережево - мікромасло" → two), matched to the Materials collection
 * case-insensitively, and missing materials are created. An empty cell leaves
 * the product's materials unchanged.
 */

export interface TorgsoftRow {
  sku: string
  colorName: string
  size: string
  stock: number
  price: number
  wholesalePrice: number
  material: string
}

export interface TorgsoftImportResult {
  updated: number
  updatedItems: { id: number; title: string; sku: string; colorName: string }[]
  notFound: { sku: string; colorName: string }[]
  ambiguous: { sku: string; colorName: string; matchedIds: number[] }[]
  skipped: { sku: string; colorName: string; reason: string }[]
  createdMaterials: string[]
  /** Other colors of an article (absent from the file) that got the article's material. */
  materialFilled: { id: number; title: string; sku: string }[]
}

// Headers as Torgsoft exports them (case/whitespace may vary).
type RequiredColumn = Exclude<keyof TorgsoftRow, 'material'>

const HEADER_ALIASES: Record<RequiredColumn, string[]> = {
  sku: ['артикул'],
  colorName: ['колір', 'колiр', 'цвет'],
  size: ['розмір', 'розмiр', 'размер'],
  stock: ['кількість', 'кiлькiсть', 'количество'],
  price: ['ціна роздрібна', 'цiна роздрiбна', 'цена розничная'],
  wholesalePrice: ['ціна опту', 'цiна опту', 'цена опт', 'цена оптовая'],
}

const MATERIAL_ALIASES = ['матеріал', 'матерiал', 'материал']

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildColumnIndex(headerRow: unknown[]): Record<keyof TorgsoftRow, number> {
  const normalized = headerRow.map((h) => normalizeHeader(String(h ?? '')))
  const index = {} as Record<keyof TorgsoftRow, number>
  // Optional: -1 when the export has no material column
  index.material = normalized.findIndex((h) => MATERIAL_ALIASES.includes(h))

  for (const key of Object.keys(HEADER_ALIASES) as RequiredColumn[]) {
    const aliases = HEADER_ALIASES[key]
    const foundAt = normalized.findIndex((h) => aliases.includes(h))
    if (foundAt === -1) {
      throw new Error(
        `Не знайдено колонку "${aliases[0]}" у файлі. Перевірте заголовки таблиці.`,
      )
    }
    index[key] = foundAt
  }

  return index
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const cleaned = String(value ?? '')
    .trim()
    .replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

/**
 * Parses .xlsx/.xls (and .csv, which SheetJS also handles) into TorgsoftRow rows.
 */
export function parseTorgsoftFile(buffer: Buffer): TorgsoftRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })

  // Find the first non-empty row and use it as the header (in the screenshot file
  // there may be a service row "Стан складу ..." before the headers).
  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(String(cell ?? '')) === 'артикул'),
  )
  if (headerRowIndex === -1) {
    throw new Error('Не вдалося знайти рядок заголовків (колонку "Артикул") у файлі.')
  }

  const columnIndex = buildColumnIndex(rows[headerRowIndex])
  const dataRows = rows.slice(headerRowIndex + 1)

  const result: TorgsoftRow[] = []
  for (const row of dataRows) {
    if (!row || row.length === 0) continue
    const sku = String(row[columnIndex.sku] ?? '').trim()
    const colorName = String(row[columnIndex.colorName] ?? '').trim()
    const size = String(row[columnIndex.size] ?? '').trim()
    if (!sku && !colorName && !size) continue // if (!sku && !colorName && !size) continue // completely empty row

    result.push({
      sku,
      colorName,
      size,
      stock: toNumber(row[columnIndex.stock]),
      price: toNumber(row[columnIndex.price]),
      wholesalePrice: toNumber(row[columnIndex.wholesalePrice]),
      material: columnIndex.material === -1 ? '' : String(row[columnIndex.material] ?? '').trim(),
    })
  }

  return result
}

/** "мережево - мікромасло", "бавовна і мережево" → separate materials. */
export function splitMaterials(value: string): string[] {
  return value
    .split(/\s+-\s+|\s+і\s+|\s+та\s+|\s*[,;+\/]\s*/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const materialKey = (name: string) => name.replace(/\s+/g, ' ').trim().toLowerCase()
const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/** Finds materials by name (case-insensitive) and creates the missing ones. */
async function resolveMaterials(
  payload: Payload,
  names: string[],
  result: TorgsoftImportResult,
): Promise<Map<string, number>> {
  const existing = await payload.find({ collection: 'materials', limit: 1000, depth: 0, pagination: false })
  const byKey = new Map<string, number>()
  for (const m of existing.docs) byKey.set(materialKey(m.title), m.id as number)

  for (const name of names) {
    const key = materialKey(name)
    if (byKey.has(key)) continue
    const title = capitalize(name.replace(/\s+/g, ' ').trim())
    const created = await payload.create({ collection: 'materials', data: { title } })
    byKey.set(key, created.id as number)
    result.createdMaterials.push(title)
  }
  return byKey
}

function groupKey(sku: string, colorName: string): string {
  return `${sku}||${colorName}`
}

export async function runTorgsoftImport(
  payload: Payload,
  rows: TorgsoftRow[],
): Promise<TorgsoftImportResult> {
  const result: TorgsoftImportResult = {
    updated: 0,
    updatedItems: [],
    notFound: [],
    ambiguous: [],
    skipped: [],
    createdMaterials: [],
    materialFilled: [],
  }

  const allMaterialNames = new Map<string, string>()
  for (const row of rows) {
    for (const name of splitMaterials(row.material)) allMaterialNames.set(materialKey(name), name)
  }
  const materialIds = allMaterialNames.size
    ? await resolveMaterials(payload, [...allMaterialNames.values()], result)
    : new Map<string, number>()

  const groups = new Map<string, TorgsoftRow[]>()
  for (const row of rows) {
    if (!row.sku || !row.colorName || !row.size) {
      result.skipped.push({
        sku: row.sku,
        colorName: row.colorName,
        reason: 'Відсутній артикул, колір або розмір',
      })
      continue
    }
    const key = groupKey(row.sku, row.colorName)
    const existing = groups.get(key)
    if (existing) existing.push(row)
    else groups.set(key, [row])
  }

  for (const groupRows of groups.values()) {
    const { sku, colorName } = groupRows[0]

    // Compare the color case-insensitively (in the DB it appears as
    // "Чорний", in the Torgsoft file as "чорний"); the sku comparison is done
    // on the DB side, and the color is filtered in code so we do not depend on
    // the case sensitivity of the standard equals in Payload.
    const bySku = await payload.find({
      collection: 'products',
      where: {
        sku: { equals: sku },
      },
      limit: 1000,
      depth: 0,
    })

    const matchingDocs = bySku.docs.filter(
      (d) => (d.colorName ?? '').trim().toLowerCase() === colorName.trim().toLowerCase(),
    )
    const matches = { docs: matchingDocs }

    if (matches.docs.length === 0) {
      result.notFound.push({ sku, colorName })
      continue
    }

    if (matches.docs.length > 1) {
      result.ambiguous.push({
        sku,
        colorName,
        matchedIds: matches.docs.map((d) => d.id as number),
      })
      continue
    }

    const product = matches.docs[0]

    const price = groupRows[0].price
    const wholesalePrice = groupRows[0].wholesalePrice
    const priceMismatch = groupRows.some(
      (r) => r.price !== price || r.wholesalePrice !== wholesalePrice,
    )
    if (priceMismatch) {
      result.skipped.push({
        sku,
        colorName,
        reason: 'Ціна роздрібна/опту відрізняється між рядками цього артикулу+кольору',
      })
      continue
    }

    const newSizes = groupRows
      .filter((r) => r.stock > 0)
      .map((r) => ({ value: r.size, stock: r.stock }))

    // Materials of all rows of the group (one sku+color can list several)
    const materials = [
      ...new Set(
        groupRows.flatMap((r) => splitMaterials(r.material)).map((name) => materialIds.get(materialKey(name))!),
      ),
    ]

    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        price,
        wholesalePrice,
        sizes: newSizes,
        ...(materials.length ? { materials } : {}),
      },
    })

    result.updated++
    result.updatedItems.push({
      id: product.id as number,
      title: (product.title as string) ?? '',
      sku,
      colorName,
    })
  }

  // Colors missing from the file (e.g. sold out) share the fabric of their article:
  // fill products of that sku that have no material yet, if the file names exactly one
  // material set for the sku (0159 "атлас"/"шовк" in different colors stays untouched).
  const skuMaterials = new Map<string, Set<string>>()
  for (const row of rows) {
    const parts = splitMaterials(row.material)
    if (!row.sku || !parts.length) continue
    const key = [...new Set(parts.map(materialKey))].sort().join('|')
    const set = skuMaterials.get(row.sku) ?? new Set<string>()
    set.add(key)
    skuMaterials.set(row.sku, set)
  }
  for (const [sku, keys] of skuMaterials) {
    if (keys.size !== 1) continue
    const materials = [...keys][0].split('|').map((k) => materialIds.get(k)!)
    const bySku = await payload.find({
      collection: 'products',
      where: { sku: { equals: sku } },
      limit: 1000,
      depth: 0,
    })
    for (const product of bySku.docs) {
      if (product.materials?.length) continue
      await payload.update({ collection: 'products', id: product.id, data: { materials } })
      result.materialFilled.push({ id: product.id as number, title: product.title ?? '', sku })
    }
  }

  return result
}
