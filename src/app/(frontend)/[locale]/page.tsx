import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Product } from '@/payload-types'
import { getProducts } from '@/lib/queries'
import { getMediaAlt, getMediaUrl } from '@/lib/media'
import { ProductCard } from '@/components/shop/ProductCard'
import { HeroSection, type HeroImage } from '@/components/shop/home/HeroSection'
import { ProductSlider } from '@/components/shop/home/ProductSlider'

// The home page is built from products, so it is rendered on every request: during the build
// on Railway the DB is unavailable (postgres.railway.internal exists only at runtime)
export const dynamic = 'force-dynamic'

function toImage(product: Product): HeroImage | null {
  const media = product.images?.[0]?.image
  const url = getMediaUrl(media)
  if (!url) return null
  return { url, alt: getMediaAlt(media, product.title ?? ''), href: `/product/${product.slug}` }
}

// "Product care" block: fabric cards in a staircase, as in the design. Even cards have the label above
// the photo and are shifted down (32px / 63px from the row top), odd ones have it below.
// TODO: the 4th fabric is a duplicate "бавовна" in the design, the client has to name it; photos are placeholders for now.
const CARE_FABRICS = [
  { name: 'silk', aspect: 'aspect-[317/389]', labelAbove: false, offset: '' },
  { name: 'cotton', aspect: 'aspect-[317/419]', labelAbove: true, offset: 'mt-8' },
  { name: 'micromodal', aspect: 'aspect-[317/419]', labelAbove: false, offset: '' },
  { name: 'cotton', aspect: 'aspect-[317/389]', labelAbove: true, offset: 'mt-[63px]' },
] as const

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Home')
  const products = await getProducts({ locale })

  const withImages = products.filter((p) => getMediaUrl(p.images?.[0]?.image))
  const heroImages = withImages.slice(0, 8).map(toImage).filter((i): i is HeroImage => i !== null)
  const newest = products.slice(0, 12)

  return (
    <div className="space-y-24 lg:space-y-[150px]">
      <HeroSection images={heroImages} />

      {newest.length > 0 && (
        <section>
          <h2 className="heading-section text-black">
            {t('newArrivals')}
            <span className="ml-2 align-top font-script text-xl normal-case text-pink">({newest.length})</span>
          </h2>
          {/* As in the design: "see all" on its own row under the heading, 70px from heading to cards */}
          <div className="mb-[9px] mt-[21px] flex justify-end">
            <Link href="/catalog?sort=new" className="text-base leading-10 text-brown/50 hover:text-brown">
              {t('seeAll')}
            </Link>
          </div>
          <ProductSlider>
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} sizes="540px" />
            ))}
          </ProductSlider>
        </section>
      )}

      <section id="care" className="scroll-mt-8">
        <div className="text-center">
          <h2 className="heading-section text-black">{t('careTitle')}</h2>
          <p className="mx-auto mt-[13px] max-w-[685px] text-base leading-[18px] tracking-[2px] text-brown/50">
            {t('careText')}
          </p>
        </div>

        {/* Fabric cards: a row that bleeds off the right edge on desktop, like in the design */}
        <div className="-mr-[var(--gutter)] mt-16 flex items-start gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:mt-[124px] lg:gap-9 [&::-webkit-scrollbar]:hidden">
          {CARE_FABRICS.map((fabric, i) => {
            const label = (
              <p className="text-center font-serif text-[25px] uppercase leading-7 tracking-[2px] text-brown">{t(`fabrics.${fabric.name}`)}</p>
            )
            return (
              <div key={i} className={`flex w-[70vw] shrink-0 flex-col gap-3 sm:w-[317px] ${fabric.offset}`}>
                {fabric.labelAbove && label}
                <div aria-hidden className={`${fabric.aspect} rounded-card border border-[#d7d7d7]/60 bg-placeholder`} />
                {!fabric.labelAbove && label}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
