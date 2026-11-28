import Image from 'next/image'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Product } from '@/payload-types'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { alternates } from '@/lib/seo'
import { getHomeMaterials, getHomeReviews, getProducts } from '@/lib/queries'
import { availableFirst } from '@/lib/catalog'
import { sortByColor } from '@/lib/colors'
import { getMediaAlt, getMediaUrl } from '@/lib/media'
import { ProductCard } from '@/components/shop/ProductCard'
import { HeroSection, type HeroItem } from '@/components/shop/home/HeroSection'
import { ProductSlider } from '@/components/shop/home/ProductSlider'
import { TrustStrip } from '@/components/shop/home/TrustStrip'
import { HomeReviews } from '@/components/shop/home/HomeReviews'
import { toReviewView } from '@/lib/reviews'
import { JsonLd, storeLd } from '@/components/shop/JsonLd'
import { CONTACTS } from '@/lib/contacts'
import { cn, colorLabel } from '@/lib/utils'

// The home page is built from products, so it is rendered on every request: during the build
// on Railway the DB is unavailable (postgres.railway.internal exists only at runtime)
export const dynamic = 'force-dynamic'

type Photo = { url: string; alt: string; href: string }

function toPhoto(product: Product): Photo | null {
  const media = product.images?.[0]?.image
  const url = getMediaUrl(media)
  if (!url) return null
  return { url, alt: getMediaAlt(media, product.title ?? ''), href: `/product/${product.slug}` }
}

const modelId = (p: Product) => (typeof p.model === 'object' && p.model !== null ? p.model.id : p.model)

/**
 * Hero: the newest product with a photo, plus every other color of its model (each color card is a
 * separate product linked by `model`). Swatches follow the site-wide colour order (lib/colors); the newest
 * is marked `lead`, so its photo is the one shown on load.
 * Colors without a photo are listed too, so the hero shows as many swatches as the catalog has colors;
 * their swatch opens the product page instead of switching the photo.
 */
function heroItems(products: Product[], withImages: Product[]): HeroItem[] {
  const lead = withImages[0]
  if (!lead) return []
  const leadModel = modelId(lead)
  const colors = leadModel == null ? [lead] : [lead, ...products.filter((p) => p.id !== lead.id && modelId(p) === leadModel)]
  return sortByColor(colors, (p) => p.colorName).map((p) => {
    const photo = toPhoto(p)
    return {
      url: photo?.url,
      alt: photo?.alt ?? p.title ?? '',
      href: `/product/${p.slug}`,
      name: p.colorName ? colorLabel(p.colorName) : undefined,
      hex: p.colorHex ?? undefined,
      lead: p.id === lead.id,
    }
  })
}

// "About the brand" (Home.about1/about2): a neutral draft for the owner to rewrite. It states nothing
// the site does not already say elsewhere (Ukrainian brand, home wear and sleepwear).

// "Product care" block: fabric cards in a staircase, as in the design. Even cards have the label above
// the photo and are shifted down (32px / 63px from the row top), odd ones have it below.
// Cards come from Materials with "show on home"; the four slot shapes repeat for more cards.
const CARE_SLOTS = [
  { aspect: 'aspect-[317/389]', labelAbove: false, offset: '' },
  { aspect: 'aspect-[317/419]', labelAbove: true, offset: 'mt-8' },
  { aspect: 'aspect-[317/419]', labelAbove: false, offset: '' },
  { aspect: 'aspect-[317/389]', labelAbove: true, offset: 'mt-[63px]' },
]
// Until materials are marked for the home page in the admin (Home.fabrics.*)
const FALLBACK_FABRICS = ['silk', 'cotton', 'micromodal', 'viscose'] as const

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { alternates: alternates(locale, '') }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Home' })
  const tReviews = await getTranslations({ locale, namespace: 'Reviews' })
  const [products, homeMaterials, homeReviews] = await Promise.all([
    getProducts({ locale }),
    getHomeMaterials(locale),
    getHomeReviews(locale),
  ])
  const fabrics = homeMaterials.length
    ? homeMaterials.map((m) => ({
        title: m.title ?? '',
        href: m.slug ? `/catalog?material=${m.slug}` : null,
        imageUrl: getMediaUrl(m.image),
        careText: m.careText?.trim() || null,
      }))
    : FALLBACK_FABRICS.map((key) => ({
        title: t(`fabrics.${key}`),
        href: null as string | null,
        imageUrl: undefined as string | undefined,
        careText: null as string | null,
      }))

  // Newest first, but what can be ordered now goes ahead of sold-out cards
  const newest = availableFirst(products.slice(0, 12))
  const withImages = products.filter((p) => getMediaUrl(p.images?.[0]?.image))
  const hero = heroItems(products, withImages)
  // "Про бренд" photo: not the one the hero shows on load. Another model first, otherwise another color.
  // Swap for a dedicated brand photo when there is one.
  const lead = withImages[0]
  const aboutProduct =
    withImages.find((p) => p.id !== lead?.id && modelId(p) !== modelId(lead)) ??
    withImages.find((p) => p.id !== lead?.id) ??
    lead
  const aboutImage = aboutProduct ? toPhoto(aboutProduct) : null

  return (
    <>
      {/* Outside the spaced container: as its first child the script would push the hero down by the section gap */}
      <JsonLd data={storeLd(locale)} />
      {/* Section rhythm: the trust row already ends in a divider, so a wide gap after it read as an empty band */}
      <div className="space-y-14 lg:space-y-16">
        {/* The trust row sits closer to the hero than the regular section spacing */}
        <div className="space-y-12 lg:space-y-16">
          <HeroSection items={hero} />
          <TrustStrip />
        </div>

        {newest.length > 0 && (
          <section>
            {/* "See all" on the heading's line, on its baseline, instead of a row of its own */}
            <div className="mb-8 flex items-baseline justify-between gap-4 lg:mb-10">
              <h2 className="heading-section">
                {t('newArrivals')}
                <span className="ml-2 font-sans text-base text-brown">({newest.length})</span>
              </h2>
              <Link
                href="/catalog?sort=new"
                className="relative shrink-0 text-base text-brown underline-offset-4 transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:text-ink hover:underline"
              >
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

        {/* Reviews right after the products: what other buyers say matters most next to what is for sale */}
        <HomeReviews
          reviews={homeReviews.map((r) =>
            toReviewView(r, getMediaUrl, { locale, screenshotAlt: (author) => tReviews('screenshotAlt', { author }) }),
          )}
        />

        <section id="care" className="scroll-mt-8">
          <div className="text-center">
            <h2 className="heading-section">{t('careTitle')}</h2>
            <p className="mx-auto mt-4 max-w-[685px] text-base leading-6 text-brown">
              {t('careText')}
            </p>
          </div>

          {/* Fabric cards: on desktop four whole cards within the content; on mobile the row runs to the screen edge */}
          <div className="-mr-[var(--gutter)] mt-16 flex items-start gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:mr-0 lg:mt-[124px] lg:gap-9 lg:pr-0 [&::-webkit-scrollbar]:hidden">
            {fabrics.map((fabric, i) => {
              const slot = CARE_SLOTS[i % CARE_SLOTS.length]
              const label = (
                <p className="text-center font-serif text-[25px] leading-7 text-brown">{fabric.title}</p>
              )
              const content = (
                <>
                  {slot.labelAbove && label}
                  <div
                    className={`relative ${slot.aspect} overflow-hidden rounded-card bg-placeholder`}
                  >
                    {fabric.imageUrl && (
                      <Image src={fabric.imageUrl} alt={fabric.title} fill sizes="(max-width: 640px) 70vw, 317px" className="object-cover" />
                    )}
                    {/* Care text over the photo on hover (devices with a mouse only) */}
                    {fabric.careText && (
                      <div className="absolute inset-0 hidden items-center justify-center bg-ink/70 p-8 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:flex">
                        <p className="whitespace-pre-line text-sm leading-6 text-white">{fabric.careText}</p>
                      </div>
                    )}
                  </div>
                  {!slot.labelAbove && label}
                  {/* Touch screens have no hover: the text goes under the card instead */}
                  {fabric.careText && (
                    <p className="whitespace-pre-line text-center text-xs leading-5 text-brown [@media(hover:hover)]:hidden">
                      {fabric.careText}
                    </p>
                  )}
                </>
              )
              const className = `group flex w-[70vw] shrink-0 flex-col gap-3 sm:w-[317px] lg:w-[calc((100%-3*36px)/4)] ${slot.offset}`
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

        {/* Tinted band with a photo: plain centred text on white looked empty. The photo bleeds to the
            card edges: framed inside the padding, its grey backdrop read as a second box on the beige. */}
        <section
          aria-labelledby="about"
          className={cn(
            'grid overflow-hidden rounded-card bg-[#f4efeb]',
            aboutImage && 'lg:grid-cols-2',
          )}
        >
          {aboutImage && (
            <Link
              href={aboutImage.href}
              className="relative block aspect-[4/5] sm:aspect-[3/2] lg:aspect-auto lg:min-h-[560px]"
            >
              {/* Product shots sit on a flat ~#eaeaec backdrop: brightening it to white and multiplying
                  onto the beige card makes the backdrop vanish without a cut-out file */}
              <Image
                src={aboutImage.url}
                alt={aboutImage.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                quality={90}
                className="object-cover object-top mix-blend-multiply brightness-[1.09]"
              />
            </Link>
          )}
          <div className="self-center p-6 sm:p-10 lg:px-16 lg:py-14">
            <h2 id="about" className="heading-section">
              {t('aboutTitle')}
            </h2>
            <div className="mt-6 max-w-[520px] space-y-4 text-base leading-7 text-brown lg:mt-8 lg:text-lg lg:leading-8">
              <p>{t('about1')}</p>
              <p>{t('about2')}</p>
            </div>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8 lg:mt-10">
              <Link
                href="/catalog"
                className="flex h-11 w-[220px] items-center justify-center rounded-card bg-ink text-sm text-white transition-colors hover:bg-ink/90"
              >
                {t('toCatalog')}
              </Link>
              {CONTACTS.instagram && (
                <a
                  href={CONTACTS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative text-sm text-brown underline-offset-4 transition-colors before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:text-ink hover:underline"
                >
                  {t('instagram')}
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
