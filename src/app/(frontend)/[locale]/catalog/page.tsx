import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { alternates } from '@/lib/seo'
import type { Product } from '@/payload-types'
import { getProducts, getNonEmptyCategories, hasBestsellers } from '@/lib/queries'
import { isProductInStock } from '@/lib/stock'
import { filterProducts, getFacets, parseCatalogParams } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { CatalogSearch, FilterPanel, SortSelect } from '@/components/shop/catalog/CatalogFilters'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'

const catalogUrl = (query: Record<string, string | undefined>) => {
  const qs = new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => Boolean(e[1]))).toString()
  return qs ? `/catalog?${qs}` : '/catalog'
}

/**
 * Nothing matched: say why (search or filters) and offer a way back to the products,
 * instead of a bare "not found". A search inside a section (a category or «Бестселери») says so:
 * the chip narrows the search without it being obvious, while the product may sit in another section.
 */
async function EmptyResult({
  locale,
  params,
  suggestions,
  section,
  elsewhere,
}: {
  locale: Locale
  params: ReturnType<typeof parseCatalogParams>
  suggestions: Product[]
  /** Title of the active section; undefined in «Усі товари» */
  section?: string
  /** How many products the same search finds in the whole catalogue (searched only inside a section) */
  elsewhere: number
}) {
  const hasFilters =
    params.sizes.length > 0 ||
    params.colors.length > 0 ||
    params.materials.length > 0 ||
    Boolean(params.inStockOnly || params.min || params.max)
  // «Скинути фільтри» keeps the chosen category or the «Бестселери» section
  const bestseller = params.bestseller ? '1' : undefined
  const inSection = Boolean(params.category || params.bestseller)
  const t = await getTranslations({ locale, namespace: 'Catalog.empty' })
  const q = params.q ?? ''
  const [title, hint] = !params.q
    ? params.bestseller && !hasFilters
      ? [t('bestsellersSoon'), t('bestsellersSoonHint')]
      : [t('noFilters'), t('noFiltersHint')]
    : hasFilters
      ? [t('queryFilters', { q }), t('queryFiltersHint')]
      : section && elsewhere > 0
        ? [t('inSection', { section, q }), t('inSectionHint', { count: elsewhere })]
        : [t('query', { q }), t('queryHint')]
  // The same search without the section: only when it finds something, otherwise it is another empty page
  const searchAll = params.q && section && elsewhere > 0
  const button =
    'flex h-11 min-w-[200px] items-center justify-center rounded-card px-6 text-sm transition-colors'

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="font-serif text-2xl text-ink-text">{title}</p>
      <p className="mt-3 max-w-[420px] text-sm leading-6 text-brown">{hint}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {params.q && hasFilters ? (
          <Link
            href={catalogUrl({ category: params.category, q: params.q, bestseller })}
            className={`${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`}
          >
            {t('resetFilters')}
          </Link>
        ) : null}
        {!params.q && hasFilters && inSection ? (
          <Link
            href={catalogUrl({ category: params.category, bestseller })}
            className={`${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`}
          >
            {t('resetFilters')}
          </Link>
        ) : null}
        {searchAll ? (
          <Link href={catalogUrl({ q: params.q })} className={`${button} bg-ink text-white hover:bg-ink/90`}>
            {t('searchAll')}
          </Link>
        ) : (
          <Link href="/catalog" className={`${button} bg-ink text-white hover:bg-ink/90`}>
            {t('allProducts')}
          </Link>
        )}
      </div>

      {/* A few products in stock instead of an empty page */}
      {suggestions.length > 0 && (
        <div className="mt-14 w-full text-left">
          <p className="text-sm text-brown">{t('inStock')}</p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-10">
            {/* With nothing found these cards are the first photos on screen, so the first row gets priority too */}
            {suggestions.map((p, i) => (
              <ProductCard key={p.id} product={p} sizes="(max-width: 768px) 50vw, 300px" priority={i < 3} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>
type Props = { params: Promise<{ locale: Locale }>; searchParams: SearchParams }

/**
 * Title and description per category ("Нічні сорочки — Mariya Underwear"). Filtered and sorted
 * views point their canonical URL at the category (or the whole catalog), so Google does not
 * index them as duplicates.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Catalog' })
  const { category, bestseller } = parseCatalogParams(await searchParams)
  const active = category
    ? (await getNonEmptyCategories(locale).catch(() => [])).find((c) => c.slug === category)
    : undefined
  // Filtered views of the section point at the section itself
  if (bestseller) {
    return {
      title: t('bestsellers'),
      description: t('bestsellersDescription'),
      alternates: alternates(locale, '/catalog?bestseller=1'),
    }
  }
  if (!active?.slug) {
    return {
      title: t('title'),
      description: t('description'),
      alternates: alternates(locale, '/catalog'),
    }
  }
  const title = active.title ?? ''
  return {
    title,
    description: t('categoryDescription', { title }),
    alternates: alternates(locale, `/catalog?category=${encodeURIComponent(active.slug)}`),
  }
}

// The catalog fetches data on the server on every request.
// category and q are filtered in Payload; size/color/price/sorting in memory (lib/catalog).
export default async function CatalogPage({ params: routeParams, searchParams }: Props) {
  const { locale } = await routeParams
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Catalog' })
  const home = (await getTranslations({ locale, namespace: 'Common' }))('home')
  const raw = await searchParams
  const params = parseCatalogParams(raw)

  // «Бестселери» (products ticked in the admin, ?bestseller=1) is one more chip beside the categories:
  // «Усі товари» and the categories lead out of it. The chip is shown once a product is ticked.
  const [baseProducts, categories, showBestsellers] = await Promise.all([
    getProducts({ locale, categorySlug: params.category, q: params.q, bestseller: params.bestseller, limit: 1000 }),
    getNonEmptyCategories(locale),
    params.bestseller ? true : hasBestsellers(),
  ])
  const facets = getFacets(baseProducts)
  const products = filterProducts(baseProducts, params)
  const activeCategory = categories.find((c) => c.slug === params.category)
  const allProducts = !params.category && !params.bestseller
  // Nothing matched: offer a few products that can be ordered right now
  const suggestions = products.length
    ? []
    : (await getProducts({ locale, limit: 30 })).filter((p) => isProductInStock(p.sizes)).slice(0, 3)
  const sectionTitle = params.bestseller ? t('bestsellers') : (activeCategory?.title ?? undefined)
  // A search inside a section found nothing: count the same search in the whole catalogue, so the empty
  // state can point there (filters are left out, as «Шукати в усіх товарах» drops them too)
  const elsewhere =
    !products.length && params.q && sectionTitle ? (await getProducts({ locale, q: params.q, limit: 1000 })).length : 0

  // Capsules like the site's buttons (rounded-full = the 26px radius at this height)
  const chip = (active: boolean) =>
    cn(
      // 36px capsule, 44px tap target (the row has py-1 so the strip is not clipped by its scroll)
      "relative flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
      active ? 'border-ink bg-ink text-white' : 'border-brown/40 text-brown hover:border-ink hover:text-ink',
    )

  return (
    <div className="lg:grid lg:grid-cols-[265px_1fr] lg:gap-x-10">
      {(activeCategory?.slug || params.bestseller) && (
        <JsonLd
          data={breadcrumbsLd(
            [
              { name: home, url: '/' },
              { name: t('title'), url: '/catalog' },
              activeCategory?.slug
                ? { name: activeCategory.title ?? '', url: `/catalog?category=${encodeURIComponent(activeCategory.slug)}` }
                : { name: t('bestsellers'), url: '/catalog?bestseller=1' },
            ],
            locale,
          )}
        />
      )}
      {/* Heading above the grid, left-aligned like everything under it; on desktop it sits in the right column */}
      <div className="lg:col-start-2">
        <Breadcrumbs
          items={
            params.bestseller
              ? [{ name: home, href: '/' }, { name: t('title'), href: '/catalog' }, { name: t('bestsellers') }]
              : [{ name: home, href: '/' }, { name: activeCategory ? (activeCategory.title ?? '') : t('title') }]
          }
        />
        {/* Same voice as the home page's "Ніжність щодня": large serif in normal case, no caps and tracking */}
        <h1 className="heading-page mt-2">
          {activeCategory ? activeCategory.title : params.bestseller ? t('bestsellers') : t('title')}
        </h1>
      </div>

      {/*
        Categories as one row of capsules and the search field on the right of the same row (on mobile the field
        goes above the chips). The header's search icon focuses this field instead of opening its own panel.
      */}
      <div className="mt-6 flex flex-col gap-4 lg:col-start-2 lg:row-start-2 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {categories.length > 0 && (
          <nav
            aria-label={t('categories')}
            className="-mx-[var(--gutter)] order-2 -my-1 flex min-w-0 gap-2 overflow-x-auto px-[var(--gutter)] py-1 [scrollbar-width:none] lg:order-1 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <Link href={catalogUrl({ q: params.q })} className={chip(allProducts)} aria-current={allProducts ? 'page' : undefined}>
              {t('all')}
            </Link>
            {showBestsellers && (
              <Link
                href={catalogUrl({ q: params.q, bestseller: '1' })}
                className={chip(params.bestseller)}
                aria-current={params.bestseller ? 'page' : undefined}
              >
                {t('bestsellers')}
              </Link>
            )}
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={catalogUrl({ category: cat.slug ?? undefined, q: params.q })}
                className={chip(params.category === cat.slug)}
                aria-current={params.category === cat.slug ? 'page' : undefined}
              >
                {cat.title}
              </Link>
            ))}
          </nav>
        )}
        <div className="order-1 lg:order-2 lg:ml-auto">
          <CatalogSearch value={params.q} />
        </div>
      </div>

      <div className="mt-8 lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:mt-6">
        <FilterPanel params={params} facets={facets} />
      </div>

      <div className="mt-8 lg:col-start-2 lg:row-start-3">
        <div className="mb-6 flex items-center justify-between text-sm text-brown">
          {/* role=status: a screen reader hears the new count after a filter, the sorting or the search */}
          <p role="status">
            {t('count', { count: products.length })}
          </p>
          <SortSelect value={params.sort} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-10 lg:gap-y-12">
            {/* The first row (3 cards on desktop, 2 + 1 on phones) is above the fold: priority, not lazy */}
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} sizes="(max-width: 768px) 80vw, 540px" priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyResult locale={locale} params={params} suggestions={suggestions} section={sectionTitle} elsewhere={elsewhere} />
        )}
      </div>
    </div>
  )
}
