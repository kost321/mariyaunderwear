import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Общие стили для текста описания: параграфы, списки, таблицы. */
const proseClass =
  'product-description max-w-none text-sm text-muted-foreground [&_p]:my-2 [&_strong]:font-semibold [&_a]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left'

/**
 * Рендер richText-описания товара. Payload хранит описание как Lexical
 * JSON; convertLexicalToHTML превращает его в безопасный HTML-строку.
 */
export function RichText({
  data,
}: {
  data?: SerializedEditorState | null
}) {
  if (!data) return null

  const html = convertLexicalToHTML({ data })

  return (
    <div
      className={proseClass}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Рендер поля descriptionHtml — готового HTML (таблицы, сложная вёрстка),
 * который владелица вставляет в админке. Выводится как есть.
 */
export function RawHtml({ html }: { html?: string | null }) {
  if (!html || !html.trim()) return null

  return (
    <div
      className={proseClass}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
