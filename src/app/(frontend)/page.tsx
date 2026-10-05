import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getCategories, getProducts } from '@/lib/queries'
import { getMediaAlt, getMediaUrl } from '@/lib/media'
import { ProductCard } from '@/components/shop/ProductCard'
import { HeroSection, type HeroImage } from '@/components/shop/home/HeroSection'
import { ProductSlider } from '@/components/shop/home/ProductSlider'
import { CollectionTabs } from '@/components/shop/home/CollectionTabs'

// The home page is built from products, so it is rendered on every request: during the build
// on Railway the DB is unavailable (postgres.railway.internal exists only at runtime)
export const dynamic = 'force-dynamic'

function toImage(product: Product): HeroImage | null {
  const media = product.images?.[0]?.image
  const url = getMediaUrl(media)
  if (!url) return null
  return { url, alt: getMediaAlt(media, product.title), href: `/product/${product.slug}` }
}

// Staggered photos in the "Our approach" block: vertical offsets from the design
const APPROACH_OFFSETS = ['lg:mt-0', 'lg:mt-[73px]', 'lg:mt-0', 'lg:mt-[103px]']

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()])

  const withImages = products.filter((p) => getMediaUrl(p.images?.[0]?.image))
  const heroImages = withImages.slice(0, 8).map(toImage).filter((i): i is HeroImage => i !== null)
  const approachImages = withImages.slice(8, 12).map(toImage).filter((i): i is HeroImage => i !== null)
  const newest = products.slice(0, 12)

  // Tabs only include categories that have products
  const usedCategoryIds = new Set(products.map((p) => (typeof p.category === 'object' ? p.category.id : p.category)))
  const tabs = categories.filter((c) => usedCategoryIds.has(c.id)).map((c) => ({ id: c.id, title: c.title }))

  return (
    <div className="space-y-24 lg:space-y-[150px]">
      <HeroSection images={heroImages} />

      {newest.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-[32px] uppercase leading-[34px] tracking-[2px] text-black lg:text-5xl lg:leading-10">
              Новинки
              <br />
              тижня
              <span className="ml-2 align-top font-script text-xl normal-case text-pink">({newest.length})</span>
            </h2>
            <Link href="/catalog?sort=new" className="text-base text-brown/50 hover:text-brown">
              Дивитись усі
            </Link>
          </div>
          <ProductSlider>
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} sizes="540px" />
            ))}
          </ProductSlider>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <h2 className="mb-10 font-serif text-[32px] uppercase leading-[34px] tracking-[2px] text-black lg:text-5xl lg:leading-10">
            Колекція
            <br />
            2026
          </h2>
          <CollectionTabs
            tabs={tabs}
            items={products.map((p) => ({
              categoryId: typeof p.category === 'object' ? p.category.id : p.category,
              node: <ProductCard key={p.id} product={p} />,
            }))}
          />
        </section>
      )}

      <section>
        <div className="mx-auto max-w-[940px] text-center">
          <h2 className="font-serif text-[26px] uppercase leading-tight tracking-[2px] text-black lg:text-5xl lg:leading-10">
            Наш підхід до дизайну
          </h2>
          <p className="mx-auto mt-4 max-w-[685px] text-base leading-[18px] tracking-[2px] text-brown/50">
            Ми поєднуємо ніжність і якість: кожна модель створена з любов&apos;ю до деталей — м&apos;які тканини,
            продуманий крій і бездоганне оздоблення, щоб ви почувалися красивою щодня.
          </p>
        </div>

        {/* Four photos in a staircase; placeholders when there are no photos, as in the design */}
        <div className="mt-16 grid grid-cols-2 items-start gap-4 lg:mt-[140px] lg:grid-cols-4 lg:gap-9">
          {APPROACH_OFFSETS.map((offset, i) => {
            const image = approachImages[i]
            const className = `relative block aspect-[317/419] overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40 ${offset} ${i % 2 ? 'mt-10' : ''}`
            return image ? (
              <Link key={i} href={image.href} className={className}>
                <Image src={image.url} alt={image.alt} fill quality={85} sizes="(max-width: 1024px) 50vw, 317px" className="object-cover" />
              </Link>
            ) : (
              <div key={i} aria-hidden className={className} />
            )
          })}
        </div>
      </section>
    </div>
  )
}
