import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getHomeMaterials, getProducts } from '@/lib/queries'
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
  return { url, alt: getMediaAlt(media, product.title), href: `/product/${product.slug}` }
}

// "Product care" block: fabric cards in a staircase, as in the design. Even cards have the label above
// the photo and are shifted down (32px / 63px from the row top), odd ones have it below.
// Cards come from Materials with "show on home"; the four slot shapes repeat for more cards.
const CARE_SLOTS = [
  { aspect: 'aspect-[317/389]', labelAbove: false, offset: '' },
  { aspect: 'aspect-[317/419]', labelAbove: true, offset: 'mt-8' },
  { aspect: 'aspect-[317/419]', labelAbove: false, offset: '' },
  { aspect: 'aspect-[317/389]', labelAbove: true, offset: 'mt-[63px]' },
]
// Until materials are marked for the home page in the admin
const FALLBACK_FABRICS = ['Шовк', 'Бавовна', 'Мікромасло', 'Віскоза'].map((title) => ({
  title,
  href: null as string | null,
  imageUrl: null as string | null,
}))

export default async function HomePage() {
  const [products, homeMaterials] = await Promise.all([getProducts(), getHomeMaterials()])
  const fabrics = homeMaterials.length
    ? homeMaterials.map((m) => ({
        title: m.title,
        href: m.slug ? `/catalog?material=${m.slug}` : null,
        imageUrl: getMediaUrl(m.image),
      }))
    : FALLBACK_FABRICS

  const withImages = products.filter((p) => getMediaUrl(p.images?.[0]?.image))
  const heroImages = withImages.slice(0, 8).map(toImage).filter((i): i is HeroImage => i !== null)
  const newest = products.slice(0, 12)

  return (
    <div className="space-y-24 lg:space-y-[150px]">
      <HeroSection images={heroImages} />

      {newest.length > 0 && (
        <section>
          <h2 className="heading-section text-black">
            Новинки
            <span className="ml-2 align-top font-script text-xl normal-case text-pink">({newest.length})</span>
          </h2>
          {/* As in the design: "see all" on its own row under the heading, 70px from heading to cards */}
          <div className="mb-[9px] mt-[21px] flex justify-end">
            <Link href="/catalog?sort=new" className="text-base leading-10 text-brown/50 hover:text-brown">
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

      <section id="care" className="scroll-mt-8">
        <div className="text-center">
          <h2 className="heading-section text-black">Догляд за виробами</h2>
          <p className="mx-auto mt-[13px] max-w-[685px] text-base leading-[18px] tracking-[2px] text-brown/50">
            Правильний догляд зберігає м&apos;якість тканини та форму виробу. Ніжне прання при 30°, без відбілювачів,
            сушіння в розправленому вигляді — і ваші речі довго залишатимуться як нові.
          </p>
        </div>

        {/* Fabric cards: a row that bleeds off the right edge on desktop, like in the design */}
        <div className="-mr-[var(--gutter)] mt-16 flex items-start gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:mt-[124px] lg:gap-9 [&::-webkit-scrollbar]:hidden">
          {fabrics.map((fabric, i) => {
            const slot = CARE_SLOTS[i % CARE_SLOTS.length]
            const label = (
              <p className="text-center font-serif text-[25px] uppercase leading-7 tracking-[2px] text-brown">{fabric.title}</p>
            )
            const content = (
              <>
                {slot.labelAbove && label}
                <div
                  className={`relative ${slot.aspect} overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder`}
                >
                  {fabric.imageUrl && (
                    <Image src={fabric.imageUrl} alt={fabric.title} fill sizes="(max-width: 640px) 70vw, 317px" className="object-cover" />
                  )}
                </div>
                {!slot.labelAbove && label}
              </>
            )
            const className = `flex w-[70vw] shrink-0 flex-col gap-3 sm:w-[317px] ${slot.offset}`
            return fabric.href ? (
              <Link key={i} href={fabric.href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={i} className={className}>
                {content}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
