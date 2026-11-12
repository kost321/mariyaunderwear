'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { parseSizeChart, sameSize } from '@/lib/productText'
import { cn } from '@/lib/utils'

/**
 * "Розмірна таблиця" link + the chart in a dialog: a bottom sheet on phones (full width, rounded top,
 * a grab handle), a centred window on larger screens. The admin's size chart HTML is a hand-made card;
 * its data is read out (lib/productText parseSizeChart) and drawn like the "Характеристики" table:
 * thin horizontal lines, units in the column titles, the size picked on the page highlighted.
 * If no table can be read, the HTML is shown as is without its inline styles.
 *
 * The dialog is portalled to <body>: inside the sticky product panel it was trapped under the header.
 * Esc, the backdrop and the close button close it; the page under it does not scroll while it is open.
 */
export function SizeChart({ html, selected }: { html?: string | null; selected?: string }) {
  const [open, setOpen] = useState(false)
  const chart = useMemo(() => parseSizeChart(html), [html])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Lock background scrolling while the window is open
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
        className="text-xs text-brown/80 underline underline-offset-2 transition-colors hover:text-brown"
      >
        Розмірна таблиця
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-chart-title"
          >
            <div
              className="relative max-h-[85vh] w-full overflow-y-auto overscroll-contain rounded-t-card bg-white px-5 pb-6 pt-3 shadow-xl sm:max-w-xl sm:rounded-card sm:px-8 sm:pb-7 sm:pt-7"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab handle of the bottom sheet (phones) */}
              <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-brown/25 sm:hidden" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-brown transition-colors hover:bg-cream hover:text-ink sm:right-4 sm:top-4"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>

              <h2 id="size-chart-title" className="pr-10 font-serif text-2xl text-ink-text">
                Розмірна таблиця
              </h2>

              {chart ? (
                <>
                  {chart.caption && <p className="mt-1 text-sm text-brown/80">{chart.caption}</p>}
                  <table className="mt-5 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-brown/15">
                        {chart.headers.map((h, i) => (
                          <th
                            key={i}
                            scope="col"
                            className={cn('pb-2 font-normal text-brown/80', i === 0 ? 'pl-2 text-left' : 'pr-2 text-right')}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.rows.map((row, r) => {
                        const isSelected = Boolean(selected && sameSize(row[0] ?? '', selected))
                        return (
                          <tr
                            key={r}
                            aria-current={isSelected ? 'true' : undefined}
                            className={cn(
                              'border-b border-brown/15 last:border-0',
                              isSelected && 'bg-[#f4efeb] font-medium',
                            )}
                          >
                            {row.map((cell, i) =>
                              i === 0 ? (
                                <th key={i} scope="row" className="py-3 pl-2 text-left font-medium text-ink">
                                  {cell}
                                  {isSelected && <span className="ml-2 text-xs font-normal text-brown">обрано</span>}
                                </th>
                              ) : (
                                <td key={i} className="py-3 pr-2 text-right tabular-nums text-ink">
                                  {cell}
                                </td>
                              ),
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {chart.note && (
                    <p className="mt-5 rounded-2xl bg-[#f4efeb] px-4 py-3 text-sm leading-6 text-brown">
                      <span className="font-medium text-ink">{chart.note.lead}</span> {chart.note.text}
                    </p>
                  )}
                </>
              ) : (
                <div
                  className="mt-5 text-sm text-brown [&_p]:my-2 [&_strong]:font-medium [&_table]:w-full [&_td]:border-b [&_td]:border-brown/15 [&_td]:py-2 [&_th]:border-b [&_th]:border-brown/15 [&_th]:py-2 [&_th]:text-left [&_th]:font-normal"
                  dangerouslySetInnerHTML={{ __html: html.replace(/\s*style="[^"]*"/g, '') }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
