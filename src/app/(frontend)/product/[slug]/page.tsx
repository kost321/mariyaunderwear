import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  getProductBySlug,
  getAllProductSlugs,
  getColorVariants,
} from '@/lib/queries'
import { getMediaUrl } from '@/lib/media'
import { ProductDetails } from '@/components/shop/ProductDetails'
import { ProductDescription } from '@/components/shop/ProductDescription'
import { ProductCard } from '@/components/shop/ProductCard'
import type { Product } from '@/payload-types'

type Params = { params: Promise<{ slug: string }> }

/**
 * ISR: сторінка статична, але не рідше ніж раз на 60 секунд Next пересобирає
 * її з актуальними даними з БД. Правки в адмінці (ціна, кольори, варіанти
 * моделі) підхоплюються без ручного редеплою.
 */
export const revalidate = 60

/**
 * SSG: заранее генерируем страницы всех активных товаров.
 * Делает страницы статичными и максимально SEO-friendly.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    // БД недоступна під час білду (наприклад, на Railway без підключеної бази)
    return []
  }
}

/** Динамические SEO-метаданные на основе товара. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Товар не знайдено' }

  const ogImage = getMediaUrl(product.images?.[0]?.image)

  return {
    title: product.title,
    description: `${product.title} — купити в магазині Mariya Underwear.`,
    openGraph: {
      title: product.title,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  // Если товара нет или он неактивен — 404.
  if (!product) notFound()

  // Другие цветовые варианты этой же модели (каждый — отдельная карточка).
  // product.model приходит объектом (depth: 2) или числом — берём id.
  const modelId =
    typeof product.model === 'object' && product.model !== null
      ? product.model.id
      : product.model
  const [colorVariants] = await Promise.all([
    modelId ? getColorVariants(modelId) : Promise.resolve([]),
  ])

  // relatedProducts — товари, вручну обрані в адмінці (relationship, hasMany).
  // Payload с depth: 2 повертає їх повними об'єктами, а не просто id.
  const relatedProducts = (product.relatedProducts ?? []).filter(
    (item): item is Product => typeof item === 'object' && item !== null,
  )

  return (
    // pb-20 — місце під закріплену кнопку «Додати в кошик» на мобілці
    <article className="pb-20 lg:pb-0">
      <nav className="mb-6 hidden lg:block">
        <Link href="/catalog" aria-label="Назад до каталогу" className="inline-block transition-opacity hover:opacity-70">
          <Image src="/brand/arrow-long.svg" alt="" width={61} height={14} className="w-[61px]" />
        </Link>
      </nav>

      <ProductDetails product={product} colorVariants={colorVariants} />

      {/* Опис, склад і догляд — під галереєю на всю ширину блоку, як у макеті */}
      <div className="mx-auto mt-12 lg:mt-[100px] lg:max-w-[911px]">
        <ProductDescription
          sections={[
            { html: product.description },
            // «Характеристики:» уже є в самому тексті з адмінки — свій заголовок не додаємо
            { html: product.descriptionHtml },
            { title: 'Рекомендації щодо прання', html: product.careHtml },
          ]}
        />
      </div>

      {/* «З цим товаром часто купують» — товари, вручну обрані в адмінці */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 lg:mt-[100px]">
          <h2 className="border-b border-brown/40 pb-5 font-serif text-xl uppercase leading-10 tracking-[2px] text-brown">
            З цим товаром часто купують
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-[41px] lg:gap-y-12">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
