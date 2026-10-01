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
import { ProductCard } from '@/components/shop/ProductCard'
import { ProductSlider } from '@/components/shop/home/ProductSlider'
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
    <article>
      <nav className="mb-6 hidden lg:block">
        <Link href="/catalog" aria-label="Назад до каталогу" className="inline-block transition-opacity hover:opacity-70">
          <Image src="/brand/arrow-long.svg" alt="" width={61} height={14} className="w-[61px]" />
        </Link>
      </nav>

      <ProductDetails product={product} colorVariants={colorVariants} />

      {/* Схожі товари — вручну обрані в адмінці; у стилі «Новинок тижня» з головної */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 lg:mt-[150px]">
          <h2 className="mb-6 font-serif text-[32px] uppercase leading-[34px] tracking-[2px] text-black lg:text-5xl lg:leading-10">
            Схожі
            <br />
            товари
          </h2>
          <ProductSlider>
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} sizes="304px" />
            ))}
          </ProductSlider>
        </section>
      )}
    </article>
  )
}
