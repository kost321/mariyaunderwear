import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getProducts, getCategories } from '@/lib/queries'
import { filterProducts, getFacets, parseCatalogParams } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterPanel, SortSelect } from '@/components/shop/catalog/CatalogFilters'

export const metadata: Metadata = {
  title: 'Каталог',
  description: 'Каталог одягу Mariya Underwear — нічні сорочки, піжами, халати, комплекти.',
}

// Каталог получает данные на сервере при каждом запросе.
// category и q фильтруют в Payload, размер/цвет/цена/сортировка — в памяти (lib/catalog).
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params = parseCatalogParams(raw)
  const showNew = raw.sort === 'new'

  // Параллельно тянем товары и категории из Payload (Local API).
  const [baseProducts, categories] = await Promise.all([
    getProducts({ categorySlug: params.category, q: params.q, limit: 1000 }),
    getCategories(),
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
      {/* Заголовок над сіткою: на десктопі — у правій колонці */}
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
            <Link href="/catalog?sort=new" className={chip(showNew && !params.category)}>
              Новинки
            </Link>
            <Link href="/catalog" className={chip(!showNew && !params.category)}>
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
              <ProductCard key={product.id} product={product} sizes="(max-width: 768px) 50vw, 265px" />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-brown/60">Товари не знайдено.</p>
        )}
      </div>
    </div>
  )
}
