'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Section = { title: string; html?: string | null }

/**
 * Акордеон під кнопкою «Купити» на сторінці товару.
 * Секції з порожнім html не показуються. Можна тримати відкритими
 * кілька секцій одночасно.
 *
 * HTML виводиться як є (dangerouslySetInnerHTML) — джерело довірене
 * (адмінка магазину), як і в SizeChart / RawHtml.
 */
export function ProductAccordion({ sections }: { sections: Section[] }) {
  const visible = sections.filter((s) => s.html && s.html.trim())
  const [open, setOpen] = useState<Set<number>>(new Set())

  if (visible.length === 0) return null

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="divide-y rounded-lg border">
      {visible.map((section, i) => {
        const isOpen = open.has(i)
        return (
          <div key={section.title}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium hover:bg-accent"
            >
              {section.title}
              <span
                className={cn(
                  'shrink-0 text-lg leading-none transition-transform',
                  isOpen && 'rotate-45',
                )}
                aria-hidden
              >
                +
              </span>
            </button>

            {isOpen && (
              <div
                className="prose-shop px-4 pb-4 pt-0 text-sm [&_a]:underline [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: section.html as string }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
