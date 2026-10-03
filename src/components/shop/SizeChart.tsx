'use client'

import { useEffect, useState } from 'react'

/**
 * "Size chart" link + a modal with an HTML table of sizes.
 * The HTML comes from the product's sizeChartHtml field and is rendered as is.
 * No external dependencies: overlay + Esc + click on the backdrop close the window.
 */
export function SizeChart({ html }: { html?: string | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // lock background scrolling while the window is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (!html || !html.trim()) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] uppercase text-brown/50 transition-colors hover:text-brown"
      >
        Розмірна таблиця | Як обрати розмір
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Розмірна таблиця"
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-2xl leading-none text-muted-foreground hover:text-foreground"
              aria-label="Закрити"
            >
              ×
            </button>

            <h2 className="mb-4 pr-8 font-serif text-lg uppercase tracking-[1px] text-ink">Розмірна таблиця</h2>

            <div
              className="size-chart-html text-sm [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-center [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-center [&_p]:my-2 [&_strong]:font-semibold [&_img]:mx-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      )}
    </>
  )
}
