import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts, getCategories } from '@/lib/queries'
import { ProductCard } from '@/components/shop/ProductCard'

export const metadata: Metadata = {
  title: 'Каталог',
  description: 'Каталог одягу Mariya Underwear — нічні сорочки, піжами, халати, комплекти.',
}

// Каталог получает данные на сервере при каждом запросе.
// searchParams.category — опциональный фильтр по slug категории.
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  // Параллельно тянем товары и категории из Payload (Local API).
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug: category }),
    getCategories(),
  ])

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">Каталог</h1>
        <p className="mt-1 text-muted-foreground">
          {products.length} товарів
        </p>
      </div>

      {/* Фильтр по категориям */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              !category ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            Всі
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                category === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {cat.title}
            </Link>
          ))}
        </div>
      )}

      {/* Сетка товаров — адаптивная: 2 колонки на мобильном, 4 на десктопе */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">
          Товари не знайдено.
        </p>
      )}
    </div>
  )
}
