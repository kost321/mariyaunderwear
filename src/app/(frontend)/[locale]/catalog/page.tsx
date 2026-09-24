import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getProducts, getCategories } from '@/lib/queries'
import { ProductCard } from '@/components/shop/ProductCard'
import { alternates } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return {
    title: t('catalogTitle'),
    description: t('catalogDescription'),
    alternates: alternates(locale, '/catalog'),
  }
}

// Каталог получает данные на сервере при каждом запросе.
// searchParams.category — опциональный фильтр по slug категории.
export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { category } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Catalog')

  // Параллельно тянем товары и категории из Payload (Local API).
  const [products, categories] = await Promise.all([
    getProducts({ locale, categorySlug: category }),
    getCategories(locale),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('count', { count: products.length })}
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
            {t('all')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={{ pathname: '/catalog', query: { category: cat.slug ?? '' } }}
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
          {t('empty')}
        </p>
      )}
    </div>
  )
}
