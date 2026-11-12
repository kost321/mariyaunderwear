import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getProducts, getNonEmptyCategories, hasBestsellers } from '@/lib/queries'
import { isProductInStock } from '@/lib/stock'
import { filterProducts, getFacets, parseCatalogParams } from '@/lib/catalog'
import { cn, plural } from '@/lib/utils'
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
 * instead of a bare "not found".
 */
function EmptyResult({ params, suggestions }: { params: ReturnType<typeof parseCatalogParams>; suggestions: Product[] }) {
  const hasFilters =
    params.sizes.length > 0 ||
    params.colors.length > 0 ||
    params.materials.length > 0 ||
    Boolean(params.inStockOnly || params.min || params.max)
  // «Скинути фільтри» keeps the chosen category or the «Бестселери» section
  const bestseller = params.bestseller ? '1' : undefined
  const inSection = Boolean(params.category || params.bestseller)
  const [title, hint] = !params.q
    ? params.bestseller && !hasFilters
      ? ['Бестселери скоро з\'являться', 'Поки що подивіться весь каталог.']
      : ['Немає товарів з такими фільтрами', 'Спробуйте прибрати частину фільтрів або подивіться весь каталог.']
    : hasFilters
      ? [`За запитом «${params.q}» з такими фільтрами нічого немає`, 'Спробуйте скинути фільтри — можливо, товар є в іншому розмірі чи кольорі.']
      : [`Нічого не знайдено за запитом «${params.q}»`, 'Перевірте написання або спробуйте коротше слово, наприклад «сорочка».']
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
            Скинути фільтри
          </Link>
        ) : null}
        {!params.q && hasFilters && inSection ? (
          <Link
            href={catalogUrl({ category: params.category, bestseller })}
            className={`${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`}
          >
            Скинути фільтри
          </Link>
        ) : null}
        <Link href="/catalog" className={`${button} bg-ink text-white hover:bg-ink/90`}>
          Усі товари
        </Link>
      </div>

      {/* A few products in stock instead of an empty page */}
      {suggestions.length > 0 && (
        <div className="mt-14 w-full text-left">
          <p className="text-sm text-brown">Є в наявності</p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-10">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} sizes="(max-width: 768px) 50vw, 300px" />
            ))}
          </div>
        </div>
      )}
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
  const { category, bestseller } = parseCatalogParams(await searchParams)
  const active = category
    ? (await getNonEmptyCategories().catch(() => [])).find((c) => c.slug === category)
    : undefined
  // Filtered views of the section point at the section itself
  if (bestseller) {
    return {
      title: 'Бестселери',
      description:
        'Бестселери Mariya Underwear: нічні сорочки, піжами та домашній одяг, які обирають найчастіше. Доставка Новою поштою.',
      alternates: { canonical: '/catalog?bestseller=1' },
    }
  }
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

  // «Бестселери» (products ticked in the admin, ?bestseller=1) is one more chip beside the categories:
  // «Усі товари» and the categories lead out of it. The chip is shown once a product is ticked.
  const [baseProducts, categories, showBestsellers] = await Promise.all([
    getProducts({ categorySlug: params.category, q: params.q, bestseller: params.bestseller, limit: 1000 }),
    getNonEmptyCategories(),
    params.bestseller ? true : hasBestsellers(),
  ])
  const facets = getFacets(baseProducts)
  const products = filterProducts(baseProducts, params)
  const activeCategory = categories.find((c) => c.slug === params.category)
  const allProducts = !params.category && !params.bestseller
  // Nothing matched: offer a few products that can be ordered right now
  const suggestions = products.length
    ? []
    : (await getProducts({ limit: 30 })).filter((p) => isProductInStock(p.sizes)).slice(0, 3)

  // Capsules like the site's buttons (rounded-full = the 26px radius at this height)
  const chip = (active: boolean) =>
    cn(
      'flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors',
      active ? 'border-ink bg-ink text-white' : 'border-brown/40 text-brown hover:border-ink hover:text-ink',
    )

  return (
    <div className="lg:grid lg:grid-cols-[265px_1fr] lg:gap-x-10">
      {(activeCategory?.slug || params.bestseller) && (
        <JsonLd
          data={breadcrumbsLd([
            { name: 'Головна', url: '/' },
            { name: 'Каталог', url: '/catalog' },
            activeCategory?.slug
              ? { name: activeCategory.title, url: `/catalog?category=${encodeURIComponent(activeCategory.slug)}` }
              : { name: 'Бестселери', url: '/catalog?bestseller=1' },
          ])}
        />
      )}
      {/* Heading above the grid, left-aligned like everything under it; on desktop it sits in the right column */}
      <div className="lg:col-start-2">
        <Breadcrumbs
          items={
            params.bestseller
              ? [{ name: 'Головна', href: '/' }, { name: 'Каталог', href: '/catalog' }, { name: 'Бестселери' }]
              : [{ name: 'Головна', href: '/' }, { name: activeCategory ? activeCategory.title : 'Каталог' }]
          }
        />
        {/* Same voice as the home page's "Ніжність щодня": large serif in normal case, no caps and tracking */}
        <h1 className="heading-page mt-2">
          {activeCategory ? activeCategory.title : params.bestseller ? 'Бестселери' : 'Каталог'}
        </h1>
      </div>

      {/*
        Categories as one row of capsules and the search field on the right of the same row (on mobile the field
        goes above the chips). The header's search icon focuses this field instead of opening its own panel.
      */}
      <div className="mt-6 flex flex-col gap-4 lg:col-start-2 lg:row-start-2 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {categories.length > 0 && (
          <nav
            aria-label="Категорії"
            className="-mx-[var(--gutter)] order-2 flex min-w-0 gap-2 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] lg:order-1 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <Link href={catalogUrl({ q: params.q })} className={chip(allProducts)} aria-current={allProducts ? 'page' : undefined}>
              Усі товари
            </Link>
            {showBestsellers && (
              <Link
                href={catalogUrl({ q: params.q, bestseller: '1' })}
                className={chip(params.bestseller)}
                aria-current={params.bestseller ? 'page' : undefined}
              >
                Бестселери
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
        <div className="mb-6 flex items-center justify-between text-sm text-brown/60">
          <p>
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
          <EmptyResult params={params} suggestions={suggestions} />
        )}
      </div>
    </div>
  )
}
