import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug, getAllProductSlugs } from '@/lib/queries'
import { getMediaUrl } from '@/lib/media'
import { ProductDetails } from '@/components/shop/ProductDetails'
import { RichText } from '@/components/shop/RichText'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type Params = { params: Promise<{ slug: string }> }

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
  if (!product) return { title: 'Товар не найден' }

  const ogImage = getMediaUrl(product.images?.[0]?.image)

  return {
    title: product.title,
    description: `${product.title} — купить в магазине OLGA.`,
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

  return (
    <article className="space-y-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-foreground">
          ← Назад в каталог
        </Link>
      </nav>

      <ProductDetails product={product} />

      {product.description && (
        <section className="max-w-2xl space-y-3">
          <h2 className="text-lg font-semibold">Описание</h2>
          <RichText data={product.description as SerializedEditorState} />
        </section>
      )}
    </article>
  )
}
