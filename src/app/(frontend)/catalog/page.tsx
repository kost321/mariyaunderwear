import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts, getNonEmptyCategories } from '@/lib/queries'
import { filterProducts, getFacets, parseCatalogParams } from '@/lib/catalog'
import { cn, plural } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterPanel, SortSelect } from '@/components/shop/catalog/CatalogFilters'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'

const catalogUrl = (query: Record<string, string | undefined>) => {
  const qs = new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => Boolean(e[1]))).toString()
  return qs ? `/catalog?${qs}` : '/catalog'
}

/**
 * Nothing matched: say why (search or filters) and offer a way back to the products,
 * instead of a bare "not found".
 */
function EmptyResult({ params }: { params: ReturnType<typeof parseCatalogParams> }) {
  const hasFilters =
    params.sizes.length > 0 ||
    params.colors.length > 0 ||
    params.materials.length > 0 ||
    Boolean(params.inStockOnly || params.min || params.max)
  const [title, hint] = !params.q
    ? ['Немає товарів з такими фільтрами', 'Спробуйте прибрати частину фільтрів або подивіться весь каталог.']
    : hasFilters
      ? [`За запитом «${params.q}» з такими фільтрами нічого немає`, 'Спробуйте скинути фільтри — можливо, товар є в іншому розмірі чи кольорі.']
      : [`За запитом «${params.q}» нічого не знайшли`, 'Перевірте написання або спробуйте коротше слово, наприклад «сорочка».']
  const button =
    'flex h-11 min-w-[200px] items-center justify-center rounded-card px-6 text-sm transition-colors'

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="font-serif text-2xl text-ink-text">{title}</p>
      <p className="mt-3 max-w-[420px] text-sm leading-6 text-brown">{hint}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {params.q && hasFilters ? (
          <Link
            href={catalogUrl({ category: params.category, q: params.q })}
            className={`${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`}
          >
            Скинути фільтри
          </Link>
        ) : null}
        {!params.q && hasFilters && params.category ? (
          <Link
            href={catalogUrl({ category: params.category })}
            className={`${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`}
          >
            Скинути фільтри
          </Link>
        ) : null}
        <Link href="/catalog" className={`${button} bg-ink text-white hover:bg-ink/90`}>
          Усі товари
        </Link>
      </div>
    </div>
  )
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Title and description per category ("Нічні сорочки — Mariya Underwear"). Filtered and sorted
 * views point their canonical URL at the category (or the whole catalog), so Google does not
 * index them as duplicates.
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category } = parseCatalogParams(await searchParams)
  const active = category
    ? (await getNonEmptyCategories().catch(() => [])).find((c) => c.slug === category)
    : undefined
  if (!active?.slug) {
    return {
      title: 'Каталог',
      description:
        'Каталог Mariya Underwear: жіночі нічні сорочки, піжами, халати та комплекти для дому й сну. Доставка Новою поштою.',
      alternates: { canonical: '/catalog' },
    }
  }
  return {
    title: active.title,
    description: `${active.title} від Mariya Underwear — жіночий домашній одяг і білизна для сну. Доставка Новою поштою по Україні.`,
    alternates: { canonical: `/catalog?category=${encodeURIComponent(active.slug)}` },
  }
}

// The catalog fetches data on the server on every request.
// category and q are filtered in Payload; size/color/price/sorting in memory (lib/catalog).
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const raw = await searchParams
  const params = parseCatalogParams(raw)

  // Fetch products and categories from Payload in parallel (Local API).
  const [baseProducts, categories] = await Promise.all([
    getProducts({ categorySlug: params.category, q: params.q, limit: 1000 }),
    getNonEmptyCategories(),
  ])
  const facets = getFacets(baseProducts)
  const products = filterProducts(baseProducts, params)
  const activeCategory = categories.find((c) => c.slug === params.category)

  // Capsules like the site's buttons (rounded-full = the 26px radius at this height)
  const chip = (active: boolean) =>
    cn(
      'flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors',
      active ? 'border-ink bg-ink text-white' : 'border-brown/40 text-brown hover:border-ink hover:text-ink',
    )

  return (
    <div className="lg:grid lg:grid-cols-[265px_1fr] lg:gap-x-10">
      {activeCategory?.slug && (
        <JsonLd
          data={breadcrumbsLd([
            { name: 'Головна', url: '/' },
            { name: 'Каталог', url: '/catalog' },
            { name: activeCategory.title, url: `/catalog?category=${encodeURIComponent(activeCategory.slug)}` },
          ])}
        />
      )}
      {/* Heading above the grid: on desktop it sits in the right column */}
      <div className="text-center lg:col-start-2 lg:text-left">
        <nav aria-label="Хлібні крихти" className="text-xs text-brown/60">
          <Link href="/" className="hover:text-brown">
            Головна
          </Link>
          {' / '}
          <span className="text-brown">{activeCategory ? activeCategory.title : 'Каталог'}</span>
        </nav>
        {/* Same voice as the home page's "Ніжність щодня": large serif in normal case, no caps and tracking */}
        <h1 className="mt-2 font-serif text-[36px] leading-[40px] text-ink-text lg:text-[48px] lg:leading-[52px]">
          {activeCategory ? activeCategory.title : 'Каталог'}
        </h1>
      </div>

      {/*
        Categories: one row of capsules under the heading, scrolling sideways on mobile.
        No search field here: the header's search icon is the only search on the site (it submits to /catalog?q=…).
      */}
      {categories.length > 0 && (
        <nav
          aria-label="Категорії"
          className="-mx-[var(--gutter)] mt-6 flex gap-2 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] lg:col-start-2 lg:row-start-2 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <Link href="/catalog" className={chip(!params.category)} aria-current={!params.category ? 'page' : undefined}>
            Усі товари
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className={chip(params.category === cat.slug)}
              aria-current={params.category === cat.slug ? 'page' : undefined}
            >
              {cat.title}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8 lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:mt-6">
        <FilterPanel params={params} facets={facets} />
      </div>

      <div className="mt-8 lg:col-start-2 lg:row-start-3">
        <div className="mb-6 flex items-center justify-between text-sm text-brown/60">
          <p>
            {params.q && (
              // The query has no field of its own on this page: it shows as a capsule with a reset cross
              <Link
                href={catalogUrl({ category: params.category })}
                aria-label={`Скинути пошук «${params.q}»`}
                className="mr-3 inline-flex h-8 items-center gap-2 rounded-full bg-cream/70 pl-3.5 pr-3 text-ink transition-colors hover:bg-cream"
              >
                Пошук «{params.q}»<span aria-hidden className="text-base leading-none text-brown">×</span>
              </Link>
            )}
            {products.length} {plural(products.length, ['товар', 'товари', 'товарів'])}
          </p>
          <SortSelect value={params.sort} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-10 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} sizes="(max-width: 768px) 80vw, 540px" />
            ))}
          </div>
        ) : (
          <EmptyResult params={params} />
        )}
      </div>
    </div>
  )
}
