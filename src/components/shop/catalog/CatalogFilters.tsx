'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { CatalogFacets, CatalogParams } from '@/lib/catalog'
import { cn, colorLabel, isLightColor } from '@/lib/utils'

/** Updates the catalog query params without scrolling the page. */
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
    <div className="border-b border-brown/15 py-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm text-brown"
      >
        {title}
        <ChevronRight className={cn('h-4 w-4 text-ink transition-transform', open && '-rotate-90')} strokeWidth={1.5} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

const blockClass = 'border-b border-brown/15 py-5'
const blockTitle = 'text-sm text-brown'

/**
 * Left filter panel: size, colour, "in stock only", material, price. On mobile it expands with a button;
 * on desktop it stays in view while the grid scrolls (sticky).
 */
export function FilterPanel({ params, facets }: { params: CatalogParams; facets: CatalogFacets }) {
  const { update, pending } = useUpdateParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [min, setMin] = useState(params.min?.toString() ?? '')
  const [max, setMax] = useState(params.max?.toString() ?? '')

  const activeCount =
    params.sizes.length + params.colors.length + params.materials.length + (params.inStockOnly ? 1 : 0) + (params.min || params.max ? 1 : 0)
  // One price for every product: a "from 790 to 790" range filters nothing. Kept while a range is applied, so it can be cleared.
  const showPrice = facets.priceMin < facets.priceMax || Boolean(params.min || params.max)
  const selectedColors = facets.colors.filter((c) => params.colors.includes(c.name))

  return (
    <aside className={cn('transition-opacity lg:sticky lg:top-8', pending && 'opacity-60')}>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        className="flex items-center gap-3 font-serif text-base text-ink lg:pointer-events-none"
      >
        Фільтри
        {activeCount > 0 && <span className="font-sans text-xs tracking-normal text-brown/80">({activeCount})</span>}
        <ChevronRight
          className={cn('h-4 w-4 transition-transform lg:hidden', mobileOpen && 'rotate-90')}
          strokeWidth={1.5}
        />
      </button>

      <div className={cn('mt-1 lg:block', mobileOpen ? 'block' : 'hidden')}>
        {facets.sizes.length > 0 && (
          <div className={blockClass}>
            <p className={blockTitle}>Розмір</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {facets.sizes.map((size) => {
                const on = params.sizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ size: toggle(params.sizes, size).join(',') || undefined })}
                    className={cn(
                      'flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm transition-colors',
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

        {/* Colours: round swatches like the sizes, the selected ones ringed and named next to the title */}
        {facets.colors.length > 0 && (
          <div className={blockClass}>
            <p className={blockTitle}>
              Колір
              {selectedColors.length > 0 && (
                <span className="text-ink">: {selectedColors.map((c) => colorLabel(c.name).toLowerCase()).join(', ')}</span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {facets.colors.map((color) => {
                const on = params.colors.includes(color.name)
                return (
                  <button
                    key={color.name}
                    type="button"
                    aria-pressed={on}
                    aria-label={colorLabel(color.name)}
                    title={colorLabel(color.name)}
                    onClick={() => update({ color: toggle(params.colors, color.name).join(',') || undefined })}
                    className={cn(
                      'h-8 w-8 rounded-full border transition-transform',
                      isLightColor(color.hex) || !color.hex ? 'border-brown/40' : 'border-transparent',
                      on ? 'ring-1 ring-ink ring-offset-2' : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: color.hex ?? '#ddd' }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/*
          One switch instead of "in stock / not in stock" checkboxes: nobody filters for what cannot be bought.
          Sold-out products are still listed after the available ones, with a badge on the card.
        */}
        <div className={blockClass}>
          <button
            type="button"
            role="switch"
            aria-checked={params.inStockOnly}
            onClick={() => update({ stock: params.inStockOnly ? undefined : 'in' })}
            className="flex w-full items-center justify-between gap-3 text-left text-sm text-brown"
          >
            <span>
              Тільки в наявності <span className="text-brown/60">({facets.inStock})</span>
            </span>
            <span
              aria-hidden
              className={cn(
                'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                params.inStockOnly ? 'bg-ink' : 'bg-brown/25',
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  params.inStockOnly && 'translate-x-4',
                )}
              />
            </span>
          </button>
        </div>

        {facets.materials.length > 0 && (
          <Section title="Матеріал" defaultOpen={params.materials.length > 0}>
            <ul className="flex flex-col gap-3">
              {facets.materials.map((material) => (
                <li key={material.slug}>
                  <label className="flex cursor-pointer items-center gap-3 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={params.materials.includes(material.slug)}
                      onChange={() =>
                        update({ material: toggle(params.materials, material.slug).join(',') || undefined })
                      }
                      className="h-[22px] w-[22px] shrink-0 appearance-none rounded-md border border-[#a3a3a3] bg-white checked:border-ink checked:bg-ink"
                    />
                    {material.title}
                  </label>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {showPrice && (
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
                  className="h-10 w-full min-w-0 rounded-full border border-[#a3a3a3] px-4 text-xs text-ink placeholder:text-brown/50 focus:border-ink focus:outline-none"
                />
              ))}
              <button type="submit" className="h-10 shrink-0 rounded-full bg-ink px-4 text-xs text-white transition-colors hover:bg-ink/90">
                OK
              </button>
            </form>
          </Section>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setMin('')
              setMax('')
              update({ size: undefined, color: undefined, material: undefined, stock: undefined, min: undefined, max: undefined })
            }}
            className="mt-4 text-xs text-brown/60 underline-offset-4 hover:underline"
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

/** Sorting in the design's style: "Sort(-)" and the options under it. */
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
