/**
 * Tidying of the product HTML that comes from the admin (description, characteristics, care), done on the
 * server before rendering. The source is trusted (the store admin), so plain string transforms are enough.
 */

const decode = (s: string) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

/** Text of an HTML fragment, tags dropped and whitespace collapsed. */
export function plainText(html: string | null | undefined): string {
  return decode((html ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** " - " between words → " — " in text nodes only (attributes are left alone). */
function dashes(html: string): string {
  return html.replace(/>([^<]*)</g, (_, text: string) => `>${text.replace(/ - /g, ' — ')}<`)
}

/**
 * Description: the admin text marks its subheadings as plain paragraphs («Нічна сорочка з мереживом -
 * жіночність у кожній деталі»). A short paragraph that does not end like a sentence and is followed by
 * more text becomes an <h2>, so it reads as a heading and search engines see the structure.
 */
export function formatDescriptionHtml(html: string | null | undefined): string {
  if (!html?.trim()) return ''
  const withHeadings = html.replace(/<p>([\s\S]*?)<\/p>(?=\s*<(?:p|ul|ol|table)\b)/g, (match, inner: string) => {
    const text = plainText(inner)
    const isHeading = text.length > 0 && text.length <= 90 && !/[.!?:;,…]$/.test(text) && !/<(?:a|br)\b/.test(inner)
    return isHeading ? `<h2>${inner.trim()}</h2>` : match
  })
  return dashes(withHeadings)
}

/**
 * Characteristics table: inline styles from the admin are dropped (the page styles the table), and a cell
 * with several paragraphs («Вільний крій», «Декоративні мереживні вставки»…) becomes one comma-separated line.
 */
export function formatSpecsHtml(html: string | null | undefined): string {
  if (!html?.trim()) return ''
  const unstyled = html.replace(/<(table|thead|tbody|tr|th|td)\b([^>]*)>/g, (_, tag: string, attrs: string) => {
    const kept = attrs.replace(/\s*style="[^"]*"/g, '')
    return `<${tag}${kept}>`
  })
  const joined = unstyled.replace(/<td>([\s\S]*?)<\/td>/g, (match, inner: string) => {
    const items = [...inner.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => plainText(m[1])).filter(Boolean)
    if (items.length < 2) return match
    const line = items.map((item, i) => (i === 0 ? item : item.charAt(0).toLowerCase() + item.slice(1))).join(', ')
    return `<td>${line}</td>`
  })
  return dashes(joined)
}

/** Value of a row of the characteristics table by its label, e.g. specValue(html, 'Матеріал'). */
export function specValue(html: string | null | undefined, ...labels: string[]): string | null {
  for (const m of (html ?? '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...m[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => plainText(c[1]))
    if (cells.length >= 2 && labels.some((l) => cells[0].toLowerCase() === l.toLowerCase())) return cells[1]
  }
  return null
}

/** Paragraphs of an HTML fragment as plain text lines (hyphens between words become dashes). */
export function paragraphs(html: string | null | undefined): string[] {
  const parts = [...(html ?? '').matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)<\/(?:p|li)>/g)].map((m) => plainText(m[1]))
  const lines = parts.length ? parts : [plainText(html)]
  return lines.filter(Boolean).map((line) => line.replace(/ - /g, ' — '))
}

export type SizeChartData = {
  /** Small line above the table, e.g. "Нічна сорочка · Виміри виробу" */
  caption: string | null
  /** Column titles, the unit moved in: "Довжина, см" */
  headers: string[]
  /** Rows: the size first, then the values without the unit */
  rows: string[][]
  /** "Зверніть увагу: …" under the table, split into its bold lead and the rest */
  note: { lead: string; text: string } | null
}

const UNIT = /\s*(см|cm|мм|mm)\.?$/i

/**
 * The size chart HTML in the admin is a hand-made card with inline styles (a frame, a "CM" badge, "см" in
 * every cell). The data is read out of it and the site draws its own table; null when there is no table.
 */
export function parseSizeChart(html: string | null | undefined): SizeChartData | null {
  if (!html) return null
  const table = html.match(/<table\b[\s\S]*?<\/table>/i)?.[0]
  if (!table) return null

  const cells = (row: string) => [...row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => plainText(c[1]))
  const allRows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => cells(m[1])).filter((r) => r.length)
  if (allRows.length < 2) return null
  const [head, ...body] = allRows

  // A column whose values all end in the same unit gets it in the title instead
  const headers = head.map((title, col) => {
    if (col === 0) return title
    const unit = body.map((r) => r[col]?.match(UNIT)?.[1]).find(Boolean)
    const everyCell = unit && body.every((r) => !r[col] || UNIT.test(r[col]))
    return everyCell ? `${title.replace(/,\s*$/, '')}, ${unit.toLowerCase().replace('cm', 'см').replace('mm', 'мм')}` : title
  })
  const rows = body.map((r) =>
    r.map((value, col) => (col > 0 && headers[col] !== head[col] ? value.replace(UNIT, '') : value)),
  )

  const rest = html.replace(table, '')
  const caption = plainText(rest.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]) || null
  const noteMatch = rest.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/(?:div|p)>/i)
  const note = noteMatch ? { lead: plainText(noteMatch[1]), text: plainText(noteMatch[2]) } : null

  return { caption, headers, rows, note }
}

/** Size as written in the chart and on the size buttons, compared loosely ("М" Cyrillic, case, spaces). */
export const sameSize = (a: string, b: string) =>
  a.replace(/М/g, 'M').replace(/\s+/g, '').toUpperCase() === b.replace(/М/g, 'M').replace(/\s+/g, '').toUpperCase()
