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
