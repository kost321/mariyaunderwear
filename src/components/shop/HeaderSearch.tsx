'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import type { SearchItem, SearchResponse } from '@/app/(frontend)/api/search/route'
import { cn, formatPrice, isLightColor, plural } from '@/lib/utils'

const MIN_CHARS = 2

function ResultRow({ item, onPick }: { item: SearchItem; onPick: () => void }) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onPick}
        className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-cream/60 focus-visible:bg-cream/60 focus-visible:outline-none"
      >
        <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-placeholder/40">
          {item.image && (
            <Image src={item.image} alt="" fill sizes="48px" className={cn('object-cover', !item.inStock && 'opacity-75')} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{item.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-brown">
            {formatPrice(item.price)}
            {item.hex && (
              <span
                aria-hidden
                className={cn('ml-1 h-2.5 w-2.5 shrink-0 rounded-full border', isLightColor(item.hex) ? 'border-brown/40' : 'border-transparent')}
                style={{ backgroundColor: item.hex }}
              />
            )}
            {item.color && <span className="truncate text-brown/80">{item.color}</span>}
          </span>
        </span>
        {!item.inStock && <span className="hidden shrink-0 text-xs text-brown/70 sm:block">Немає в наявності</span>}
      </Link>
    </li>
  )
}

/**
 * Search panel that drops down over the page (it does not push the content down).
 * Results come live from /api/search as the shopper types; Enter or "Усі результати" opens the catalog
 * with the query. Closes on Esc, on a click outside and after picking a result.
 */
export function HeaderSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const query = q.trim()

  useEffect(() => {
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    // A click anywhere outside the panel closes it, the rest of the header included.
    // The search icon toggles the panel itself, so it is left to its own click handler.
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element
      if (panel.current?.contains(target) || target.closest?.('[aria-controls="header-search"]')) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [onClose])

  // Debounced fetch; a newer query aborts the one in flight, so late answers never overwrite fresh ones
  useEffect(() => {
    if (query.length < MIN_CHARS) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        if (res.ok) setData(await res.json())
      } catch {
        // aborted or offline: keep the previous results
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  const catalogHref = `/catalog?q=${encodeURIComponent(query)}`

  return (
    <>
      {/* Dims the page under the header (a click on it closes the panel, like any click outside) */}
      <div aria-hidden className="absolute inset-x-0 top-full h-screen bg-ink/20" />

      <div ref={panel} id="header-search" className="absolute inset-x-0 top-full bg-white shadow-[0_16px_32px_-16px_rgba(64,56,52,0.35)]">
        <div className="container pb-6">
          {/* Plain GET form: Enter opens the full results in the catalog; the header closes the panel on navigation */}
          <form action="/catalog" role="search" className="relative">
            <Search className="absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brown" strokeWidth={1.5} aria-hidden />
            <input
              ref={input}
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук товарів"
              aria-label="Пошук товарів"
              autoComplete="off"
              className="h-[50px] w-full rounded-full bg-cream/70 pl-12 pr-12 text-sm text-ink placeholder:text-brown/70 focus:outline-none focus:ring-1 focus:ring-brown/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  input.current?.focus()
                }}
                aria-label="Очистити"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brown hover:bg-cream"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </form>

          <div aria-live="polite" className={cn('transition-opacity', loading && 'opacity-60')}>
            {data && data.total > 0 && (
              <div className="mt-4">
                <ul className="grid gap-1 md:grid-cols-2 md:gap-x-6">
                  {data.results.map((item) => (
                    <ResultRow key={item.href} item={item} onPick={onClose} />
                  ))}
                </ul>
                <Link
                  href={catalogHref}
                  onClick={onClose}
                  className="mt-4 inline-flex h-10 items-center rounded-full border border-brown/40 px-5 text-sm text-brown transition-colors hover:border-ink hover:text-ink"
                >
                  Усі результати ({data.total} {plural(data.total, ['товар', 'товари', 'товарів'])})
                </Link>
              </div>
            )}

            {data && data.total === 0 && !loading && (
              <div className="mt-5">
                <p className="text-sm text-ink">Нічого не знайдено за запитом «{query}»</p>
                {data.suggestions.length > 0 && (
                  <>
                    <p className="mt-4 text-sm text-brown/80">Є в наявності:</p>
                    <ul className="mt-2 grid gap-1 md:grid-cols-2 md:gap-x-6">
                      {data.suggestions.map((item) => (
                        <ResultRow key={item.href} item={item} onPick={onClose} />
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
