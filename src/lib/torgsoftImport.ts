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
 */

export interface TorgsoftRow {
  sku: string
  colorName: string
  size: string
  stock: number
  price: number
  wholesalePrice: number
}

export interface TorgsoftImportResult {
  updated: number
  updatedItems: { id: number; title: string; sku: string; colorName: string }[]
  notFound: { sku: string; colorName: string }[]
  ambiguous: { sku: string; colorName: string; matchedIds: number[] }[]
  skipped: { sku: string; colorName: string; reason: string }[]
}

// Headers as Torgsoft exports them (case/whitespace may vary).
const HEADER_ALIASES: Record<keyof TorgsoftRow, string[]> = {
  sku: ['артикул'],
  colorName: ['колір', 'колiр', 'цвет'],
  size: ['розмір', 'розмiр', 'размер'],
  stock: ['кількість', 'кiлькiсть', 'количество'],
  price: ['ціна роздрібна', 'цiна роздрiбна', 'цена розничная'],
  wholesalePrice: ['ціна опту', 'цiна опту', 'цена опт', 'цена оптовая'],
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildColumnIndex(headerRow: unknown[]): Record<keyof TorgsoftRow, number> {
  const normalized = headerRow.map((h) => normalizeHeader(String(h ?? '')))
  const index = {} as Record<keyof TorgsoftRow, number>

  for (const key of Object.keys(HEADER_ALIASES) as (keyof TorgsoftRow)[]) {
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
    })
  }

  return result
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
  }

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

    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        price,
        wholesalePrice,
        sizes: newSizes,
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

  return result
}
