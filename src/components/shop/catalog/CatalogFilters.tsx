'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { CatalogFacets, CatalogParams } from '@/lib/catalog'
import { cn } from '@/lib/utils'

/** Оновлює query-параметри каталогу без прокрутки сторінки. */
function useUpdateParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    const qs = next.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return { update, pending }
}

const toggle = (values: string[], value: string) =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value]

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-dashed border-[#c9c9c9] py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm tracking-[2px] text-brown"
      >
        {title}
        <ChevronRight className={cn('h-4 w-4 text-ink transition-transform', open && '-rotate-90')} strokeWidth={1.5} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

/** Ліва панель фільтрів: розмір, колір, ціна. На мобілці розгортається кнопкою. */
export function FilterPanel({ params, facets }: { params: CatalogParams; facets: CatalogFacets }) {
  const { update, pending } = useUpdateParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [min, setMin] = useState(params.min?.toString() ?? '')
  const [max, setMax] = useState(params.max?.toString() ?? '')

  const activeCount = params.sizes.length + params.colors.length + (params.min || params.max ? 1 : 0)

  return (
    <aside className={cn('transition-opacity', pending && 'opacity-60')}>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        className="flex items-center gap-3 font-serif text-base tracking-[2px] text-ink lg:pointer-events-none"
      >
        Фільтри
        {activeCount > 0 && <span className="font-script text-lg text-pink">({activeCount})</span>}
        <ChevronRight
          className={cn('h-4 w-4 transition-transform lg:hidden', mobileOpen && 'rotate-90')}
          strokeWidth={1.5}
        />
      </button>

      <div className={cn('mt-6 lg:block', mobileOpen ? 'block' : 'hidden')}>
        {facets.sizes.length > 0 && (
          <div className="border-b border-dashed border-[#c9c9c9] pb-5">
            <p className="text-sm tracking-[2px] text-brown">Розмір</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {facets.sizes.map((size) => {
                const on = params.sizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ size: toggle(params.sizes, size).join(',') || undefined })}
                    className={cn(
                      'flex h-[39px] min-w-[38px] items-center justify-center border px-1.5 text-sm font-medium transition-colors',
                      on ? 'border-ink bg-ink text-white' : 'border-[#a3a3a3] text-brown hover:border-ink',
                    )}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {facets.colors.length > 0 && (
          <Section title="Колір" defaultOpen={params.colors.length > 0}>
            <ul className="flex flex-col gap-3">
              {facets.colors.map((color) => {
                const on = params.colors.includes(color.name)
                return (
                  <li key={color.name}>
                    <label className="flex cursor-pointer items-center gap-3 text-xs tracking-[2px] text-ink">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => update({ color: toggle(params.colors, color.name).join(',') || undefined })}
                        className="h-[22px] w-[22px] shrink-0 appearance-none border border-[#a3a3a3] bg-white checked:border-ink checked:bg-ink"
                      />
                      {color.hex && (
                        <span className="h-3 w-3 shrink-0 rounded-full border border-brown/30" style={{ backgroundColor: color.hex }} />
                      )}
                      {color.name}
                    </label>
                  </li>
                )
              })}
            </ul>
          </Section>
        )}

        <Section title="Ціна" defaultOpen={Boolean(params.min || params.max)}>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              update({ min: min || undefined, max: max || undefined })
            }}
          >
            {[
              { value: min, set: setMin, placeholder: `від ${facets.priceMin}`, label: 'Ціна від' },
              { value: max, set: setMax, placeholder: `до ${facets.priceMax}`, label: 'Ціна до' },
            ].map((f) => (
              <input
                key={f.label}
                type="number"
                inputMode="numeric"
                min={0}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                aria-label={f.label}
                className="h-[39px] w-full min-w-0 border border-[#a3a3a3] px-2 text-xs text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none"
              />
            ))}
            <button type="submit" className="h-[39px] shrink-0 bg-ink px-3 text-xs text-white">
              OK
            </button>
          </form>
        </Section>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setMin('')
              setMax('')
              update({ size: undefined, color: undefined, min: undefined, max: undefined })
            }}
            className="mt-4 text-xs tracking-[1px] text-brown/60 underline-offset-4 hover:underline"
          >
            Скинути фільтри
          </button>
        )}
      </div>
    </aside>
  )
}

const SORT_OPTIONS: { value: CatalogParams['sort']; label: string }[] = [
  { value: 'new', label: 'Спочатку нові' },
  { value: 'price-asc', label: 'Від дешевих' },
  { value: 'price-desc', label: 'Від дорогих' },
]

/** Сортування у стилі макета: «Сортування(-)» і варіанти під ним. */
export function SortSelect({ value }: { value: CatalogParams['sort'] }) {
  const { update } = useUpdateParams()
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <span className="hidden sm:inline">Сортування</span>
      <select
        value={value}
        onChange={(e) => update({ sort: e.target.value === 'new' ? undefined : e.target.value })}
        className="cursor-pointer bg-transparent text-sm text-brown/70 focus:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
