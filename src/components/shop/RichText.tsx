import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Shared styles for description text: paragraphs, lists, tables. */
const proseClass =
  'product-description max-w-none text-sm text-muted-foreground [&_p]:my-2 [&_strong]:font-semibold [&_a]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left'

/**
 * Renders the richText product description. Payload stores the description as Lexical
 * JSON; convertLexicalToHTML turns it into a safe HTML string.
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
 * Renders the descriptionHtml field: ready-made HTML (tables, complex layout)
 * that the owner pastes in the admin. Output as is.
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
