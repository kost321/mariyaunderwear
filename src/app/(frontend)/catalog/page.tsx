import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getProducts, getNonEmptyCategories } from '@/lib/queries'
import { filterProducts, getFacets, parseCatalogParams } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterPanel, SortSelect } from '@/components/shop/catalog/CatalogFilters'

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

  const chip = (active: boolean) =>
    cn(
      'flex h-[22px] min-w-[101px] shrink-0 items-center justify-center border px-3 text-[10px] uppercase transition-colors',
      active ? 'border-ink bg-ink text-white' : 'border-brown/60 text-brown hover:border-ink',
    )

  return (
    <div className="lg:grid lg:grid-cols-[265px_1fr] lg:gap-x-10">
      {/* Heading above the grid: on desktop it sits in the right column */}
      <div className="text-center lg:col-start-2 lg:text-left">
        <nav aria-label="Хлібні крихти" className="text-xs tracking-[1px] text-brown/60">
          <Link href="/" className="hover:text-brown">
            Головна
          </Link>
          {' / '}
          <span className="text-brown">{activeCategory ? activeCategory.title : 'Каталог'}</span>
        </nav>
        <h1 className="mt-2 font-serif text-xl uppercase tracking-[1px] text-ink">
          {activeCategory ? activeCategory.title : 'Каталог'}
        </h1>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:col-start-2 lg:row-start-2 lg:flex-row lg:items-center lg:gap-12">
        <form action="/catalog" role="search" className="relative lg:w-[367px] lg:shrink-0">
          {params.category && <input type="hidden" name="category" value={params.category} />}
          <Image src="/brand/search.svg" alt="" width={17} height={16} className="absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Пошук"
            aria-label="Пошук товарів"
            className="h-[50px] w-full rounded-card bg-cream/70 pl-12 pr-6 text-xs tracking-[2px] text-brown placeholder:text-right placeholder:text-brown focus:outline-none focus:ring-1 focus:ring-brown/40"
          />
        </form>

        {categories.length > 0 && (
          <div className="-mx-[var(--gutter)] grid auto-cols-max grid-flow-col grid-rows-2 gap-x-3.5 gap-y-1 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] lg:mx-0 lg:px-0">
            <Link href="/catalog" className={chip(!params.category)}>
              Усі товари
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/catalog?category=${cat.slug}`} className={chip(params.category === cat.slug)}>
                {cat.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:mt-6">
        <FilterPanel params={params} facets={facets} />
      </div>

      <div className="mt-8 lg:col-start-2 lg:row-start-3">
        <div className="mb-6 flex items-center justify-between text-sm text-brown/60">
          <p>
            {params.q ? `Пошук «${params.q}»: ` : ''}
            {products.length} товарів
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
          <p className="py-16 text-center text-brown/60">Товари не знайдено.</p>
        )}
      </div>
    </div>
  )
}
