import {
  convertLexicalToHTML,
} from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/**
 * Рендер richText-описания товара. Payload хранит описание как Lexical
 * JSON; convertLexicalToHTML превращает его в безопасный HTML-строку,
 * которую мы выводим в типографичном блоке.
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
      className="prose prose-sm max-w-none text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
