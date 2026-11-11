import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getHomeMaterials, getProducts } from '@/lib/queries'
import { getMediaAlt, getMediaUrl } from '@/lib/media'
import { ProductCard } from '@/components/shop/ProductCard'
import { HeroSection, type HeroItem, type HeroVariant } from '@/components/shop/home/HeroSection'
import { HeroVariantSwitch } from '@/components/shop/home/HeroVariantSwitch'
import { ProductSlider } from '@/components/shop/home/ProductSlider'
import { TrustStrip } from '@/components/shop/home/TrustStrip'
import { JsonLd, storeLd } from '@/components/shop/JsonLd'
import { CONTACTS } from '@/lib/contacts'
import { cn } from '@/lib/utils'

// The home page is built from products, so it is rendered on every request: during the build
// on Railway the DB is unavailable (postgres.railway.internal exists only at runtime)
export const dynamic = 'force-dynamic'

type Photo = { url: string; alt: string; href: string }

function toPhoto(product: Product): Photo | null {
  const media = product.images?.[0]?.image
  const url = getMediaUrl(media)
  if (!url) return null
  return { url, alt: getMediaAlt(media, product.title), href: `/product/${product.slug}` }
}

const modelId = (p: Product) => (typeof p.model === 'object' && p.model !== null ? p.model.id : p.model)

/**
 * Hero: the newest product with a photo, plus the other colors of its model (each color card is a
 * separate product linked by `model`). The newest stays first, so it is the photo shown on load;
 * the swatches switch between the colors.
 */
function heroItems(withImages: Product[]): HeroItem[] {
  const lead = withImages[0]
  if (!lead) return []
  const leadModel = modelId(lead)
  const colors = leadModel == null ? [lead] : [lead, ...withImages.filter((p) => p.id !== lead.id && modelId(p) === leadModel)]
  return colors.flatMap((p) => {
    const photo = toPhoto(p)
    if (!photo) return []
    return [{ ...photo, name: p.colorName ?? undefined, hex: p.colorHex ?? undefined }]
  })
}

// "About the brand": a neutral draft for the owner to rewrite. It states nothing the site does not
// already say elsewhere (Ukrainian brand, home wear and sleepwear).
const ABOUT_TEXT = [
  'Mariya Underwear — український бренд жіночого домашнього одягу та білизни для сну.',
  'Ми обираємо приємні до тіла тканини й уважно ставимося до посадки, щоб у наших речах було затишно щодня — вдома, уві сні та в хвилини відпочинку.',
]

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
  imageUrl: undefined as string | undefined,
  careText: null as string | null,
}))

const HERO_VARIANTS: HeroVariant[] = ['a', 'b', 'c']

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Client demo: /?hero=a|b|c picks the first-screen layout and shows the switch; without it, layout "a"
  const heroParam = (await searchParams).hero
  const heroVariant = HERO_VARIANTS.find((v) => v === heroParam)
  const [products, homeMaterials] = await Promise.all([getProducts(), getHomeMaterials()])
  const fabrics = homeMaterials.length
    ? homeMaterials.map((m) => ({
        title: m.title,
        href: m.slug ? `/catalog?material=${m.slug}` : null,
        imageUrl: getMediaUrl(m.image),
        careText: m.careText?.trim() || null,
      }))
    : FALLBACK_FABRICS

  const newest = products.slice(0, 12)
  const withImages = products.filter((p) => getMediaUrl(p.images?.[0]?.image))
  const hero = heroItems(withImages)
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
      <JsonLd data={storeLd()} />
      {heroVariant && <HeroVariantSwitch active={heroVariant} />}
      {/* Section rhythm: 150px from the mockup left a hole under the trust row, which already ends in a divider */}
      <div className="space-y-20 lg:space-y-28">
        {/* The trust row sits closer to the hero than the regular section spacing */}
        <div className="space-y-12 lg:space-y-16">
          <HeroSection items={hero} variant={heroVariant ?? 'a'} />
          <TrustStrip />
        </div>

        {newest.length > 0 && (
          <section>
            {/* "See all" on the heading's line, on its baseline, instead of a row of its own */}
            <div className="mb-8 flex items-baseline justify-between gap-4 lg:mb-10">
              <h2 className="heading-section text-black">
                Новинки
                <span className="ml-3 align-top font-sans text-base normal-case tracking-normal text-brown/80">({newest.length})</span>
              </h2>
              <Link
                href="/catalog?sort=new"
                className="shrink-0 text-base text-brown underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
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
            <p className="mx-auto mt-4 max-w-[685px] text-base leading-6 text-brown">
              Правильний догляд зберігає м&apos;якість тканини та форму виробу. Ніжне прання при 30°, без відбілювачів,
              сушіння в розправленому вигляді — і ваші речі довго залишатимуться як нові.
            </p>
          </div>

          {/* Fabric cards: on desktop four whole cards within the content; on mobile the row runs to the screen edge */}
          <div className="-mr-[var(--gutter)] mt-16 flex items-start gap-4 overflow-x-auto pr-[var(--gutter)] [scrollbar-width:none] lg:mr-0 lg:mt-[124px] lg:gap-9 lg:pr-0 [&::-webkit-scrollbar]:hidden">
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

        {/* Tinted band with a photo: plain centred text on white looked empty */}
        <section
          aria-labelledby="about"
          className={cn(
            'grid items-center gap-8 overflow-hidden rounded-card bg-[#f4efeb] p-6 sm:p-10 lg:gap-16 lg:p-14',
            aboutImage && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
          )}
        >
          {aboutImage && (
            <Link href={aboutImage.href} className="relative block aspect-[4/5] overflow-hidden rounded-card bg-placeholder/40">
              <Image
                src={aboutImage.url}
                alt={aboutImage.alt}
                fill
                sizes="(max-width: 1024px) 90vw, 460px"
                quality={90}
                className="object-cover"
              />
            </Link>
          )}
          <div>
            <h2 id="about" className="heading-section text-black">
              Про бренд
            </h2>
            <div className="mt-6 max-w-[560px] space-y-4 text-base leading-7 text-brown lg:mt-8">
              {ABOUT_TEXT.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/catalog"
                className="flex h-11 w-[220px] items-center justify-center rounded-card bg-ink text-sm text-white transition-colors hover:bg-ink/90"
              >
                До каталогу
              </Link>
              {CONTACTS.instagram && (
                <a
                  href={CONTACTS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-[220px] items-center justify-center rounded-card border border-brown/50 text-sm text-brown transition-colors hover:border-ink hover:text-ink"
                >
                  Ми в Instagram
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
