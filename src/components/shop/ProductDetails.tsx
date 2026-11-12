'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { cn, colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { sortByColor } from '@/lib/colors'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { SizeChart } from '@/components/shop/SizeChart'
import { PhotoLightbox } from '@/components/shop/PhotoLightbox'
import { QuickOrderModal } from '@/components/shop/QuickOrderModal'
import { useCart } from '@/hooks/useCart'
import { isProductInStock, isSizeAvailable } from '@/lib/stock'
import { productMaterials } from '@/lib/catalog'
import type { CartItem } from '@/types/shop'

const photoFrame = 'relative overflow-hidden rounded-card bg-placeholder/40'

/**
 * Interactive part of the product card (Figma design "Product"):
 *  - gallery: on desktop (~58% of the width) a large photo with a column of thumbnails on its left;
 *    on phones a swipeable carousel with dots (MobileGallery);
 *  - product panel: title, price, color, size, "Add to cart";
 *  - quick order. The description sits under the gallery (ProductDescription in page.tsx).
 *
 * Data arrives as props from the server page.tsx, so this
 * client component does not fetch anything itself.
 */
/**
 * Phone gallery: one photo per screen width, swiped with CSS scroll-snap; the dots show the position and
 * jump to a photo. Tapping a photo opens the full-screen viewer at that photo.
 */
function MobileGallery({
  photos,
  active,
  onChange,
  onOpen,
}: {
  photos: { url: string; alt: string }[]
  active: number
  onChange: (i: number) => void
  onOpen: () => void
}) {
  const track = useRef<HTMLDivElement>(null)

  // The swipe position decides which dot is active (and which photo the viewer opens on)
  const onScroll = () => {
    const el = track.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) onChange(i)
  }
  const goTo = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' })

  if (!photos.length) return <div className="aspect-[3/4] rounded-card bg-placeholder/40 lg:hidden" />

  return (
    <div className="lg:hidden">
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, i) => (
          <button
            key={photo.url + i}
            type="button"
            onClick={onOpen}
            className="relative aspect-[3/4] w-full shrink-0 snap-center bg-placeholder/40"
            aria-label={`Фото ${i + 1} з ${photos.length}, збільшити`}
          >
            <Image src={photo.url} alt={photo.alt} fill priority={i === 0} quality={85} sizes="100vw" className="object-cover" />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              // A 24px tap target around a small dot
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-4 bg-ink' : 'w-1.5 bg-brown/30')} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Composition and care for the block under the buy button (lib/productText, computed on the server) */
export type ProductFacts = { composition: string | null; care: string[] }

const infoLink = 'text-ink underline underline-offset-2 hover:no-underline'

/**
 * Short answers right under the buy button, the questions that stop a purchase: how to wash it, how it is delivered and paid for, how to return it. One or two lines each, with a link to
 * the full terms. Opening one item closes the others, so the sticky panel stays within the screen. Delivery and returns wording follows
 * the trust strip on the home page and the /delivery page.
 */
function BuyInfo({ facts }: { facts?: ProductFacts }) {
  const care = facts?.care ?? []
  const items: { title: string; body: React.ReactNode }[] = [
    // The composition is shown in the panel itself (under the SKU), so this item holds the care text only
    ...(care.length
      ? [
          {
            title: 'Догляд',
            body: (
              <>
                {care.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            ),
          },
        ]
      : []),
    {
      title: 'Доставка й оплата',
      body: (
        <p>
          Новою поштою по всій Україні, за тарифами перевізника. Оплата при отриманні або передоплата на рахунок ФОП.{' '}
          <Link href="/delivery" className={infoLink}>
            Детальніше
          </Link>
        </p>
      ),
    },
    {
      title: 'Обмін і повернення',
      body: (
        <p>
          Протягом 14 днів, якщо річ не була у використанні.{' '}
          <Link href="/delivery#returns" className={infoLink}>
            Як повернути
          </Link>
        </p>
      ),
    },
  ]
  // Closed at first, one item open at a time: an open item made the sticky panel taller than the screen.
  // The composition itself is always visible in the panel (under the SKU).
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mt-6 border-t border-brown/15">
      {items.map((item) => {
        const isOpen = open === item.title
        const id = `buy-info-${item.title.replace(/\s+/g, '-')}`
        return (
          <div key={item.title} className="border-b border-brown/15">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.title)}
              aria-expanded={isOpen}
              aria-controls={id}
              className="flex w-full items-center justify-between py-4 text-left text-sm text-ink"
            >
              {item.title}
              <ChevronDown className={cn('h-4 w-4 text-brown transition-transform', isOpen && 'rotate-180')} strokeWidth={1.5} aria-hidden />
            </button>
            {isOpen && (
              <div id={id} className="-mt-1 space-y-1 pb-4 text-sm leading-6 text-brown">
                {item.body}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ProductDetails({
  product,
  colorVariants = [],
  facts,
  description,
}: {
  product: Product
  /** Other color cards of the same model (linked by the model field). */
  colorVariants?: Product[]
  /** One-line composition and care for the block under the buy button (lib/productText, computed on the server) */
  facts?: ProductFacts
  /** Description, characteristics: under the gallery on desktop (beside the sticky panel), after the panel on phones */
  description?: React.ReactNode
}) {
  const { addItem } = useCart()

  const images = product.images ?? []
  const sizes = product.sizes ?? []
  const colors = sortByColor(product.colors ?? [], (c) => c.name)
  const materials = productMaterials(product)

  // Show the switcher links only if the model has at least 2 color cards.
  const showVariantSwitch = colorVariants.length > 1

  const [activeImage, setActiveImage] = useState(0)
  // A size without a positive stock (0 or empty) is sold out and crossed out (lib/stock).
  const soldOut = (s: { stock?: number | null }) => !isSizeAvailable(s)
  const allSoldOut = !isProductInStock(sizes)
  // A size is picked for the shopper only when a single one can be ordered: picking the first available one
  // silently put whatever size that was into the cart
  const availableSizes = sizes.filter((s) => !soldOut(s))
  const [size, setSize] = useState<string | undefined>(availableSizes.length === 1 ? availableSizes[0].value : undefined)
  // "Оберіть розмір": set when buying without a size, cleared when one is picked
  const [sizeMissing, setSizeMissing] = useState(false)
  const sizesBlock = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState<string | undefined>(colors[0]?.name)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const selectedStock = sizes.find((s) => s.value === size)?.stock
  const maxQuantity = typeof selectedStock === 'number' && selectedStock > 0 ? selectedStock : 1

  const mainImage = images[activeImage]?.image
  const mainUrl = getMediaUrl(mainImage)
  const mainAlt = getMediaAlt(mainImage, product.title)

  // Photos for the full-screen viewer (skip entries without a file).
  const lightboxPhotos = images.flatMap((item) => {
    const url = getMediaUrl(item.image)
    return url ? [{ url, alt: getMediaAlt(item.image, product.title) }] : []
  })

  // Cart / quick-order line built from the current selection on the page.
  const selectedItem: CartItem = {
    productId: String(product.id),
    title: product.title,
    price: product.price,
    slug: product.slug ?? '',
    image: getMediaUrl(images[0]?.image),
    size,
    // If the model is split into color cards, the color comes from the card,
    // otherwise from the legacy colors array (selection within the page).
    color: showVariantSwitch ? (product.colorName ?? undefined) : color,
    quantity,
  }

  function handleSelectSize(value: string, stock?: number | null) {
    setSize(value)
    setSizeMissing(false)
    if (typeof stock === 'number' && stock > 0) setQuantity((q) => Math.min(q, stock))
  }

  /** No size picked yet: bring the sizes into view and ask for one instead of adding a product without a size. */
  function needsSize() {
    if (sizes.length === 0 || size) return false
    setSizeMissing(true)
    sizesBlock.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }

  function handleAddToCart() {
    if (allSoldOut || needsSize()) return
    addItem(selectedItem)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // A sold-out colour keeps its full colour (dimmed, navy read as light blue) and is only crossed by a diagonal,
  // dark with a white edge so it shows on any colour
  const swatchClass = (active: boolean, unavailable = false) =>
    cn(
      'relative block h-9 w-9 rounded-full border transition-transform',
      active ? 'border-ink ring-1 ring-ink ring-offset-2' : 'border-brown/30 hover:scale-105',
      unavailable &&
        "after:absolute after:left-1/2 after:top-[-3px] after:h-[calc(100%+6px)] after:w-[1.5px] after:-translate-x-1/2 after:rotate-45 after:bg-ink after:shadow-[0_0_0_1px_white] after:content-['']",
    )

  // Other colours of the model that can be ordered now: offered when this one is sold out
  const inStockColors = colorVariants.filter((v) => v.id !== product.id && isProductInStock(v.sizes))

  const label = 'text-xs text-ink'

  const addButton = (className?: string) => (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={allSoldOut}
      className={cn(
        'h-10 w-full rounded-card bg-ink text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-ink',
        className,
      )}
    >
      {allSoldOut ? 'Немає в наявності' : added ? 'Додано ✓' : 'Додати в кошик'}
    </button>
  )

  return (
    // Desktop: the gallery takes ~58% of the width (for clothes the photo is the main argument), thumbnails in a
    // column on its left, the description under it. The product panel spans both rows and is sticky, so the
    // colour and the buy button stay at hand while reading. Phones: gallery, panel, description.
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-x-12 xl:gap-x-16">
      {/* MOBILE GALLERY: the photos as a swipeable carousel with dots (no thumbnail strip) */}
      <MobileGallery
        photos={lightboxPhotos}
        active={activeImage}
        onChange={setActiveImage}
        onOpen={() => setLightboxOpen(true)}
      />

      {/* DESKTOP GALLERY: large photo, thumbnails in a column on its left */}
      <div className="hidden lg:col-start-1 lg:row-start-1 lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:gap-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-placeholder/40 lg:order-2">
          {mainUrl && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute inset-0 cursor-zoom-in"
              aria-label="Збільшити фото"
            >
              <Image src={mainUrl} alt={mainAlt} fill priority quality={90} sizes="(max-width: 1024px) 100vw, 720px" className="object-cover" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          // Desktop: the column is as tall as the photo (absolute inside the stretched grid cell) and scrolls if longer
          <div className="lg:relative lg:order-1">
            <div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((item, i) => {
                const thumb = getMediaUrl(item.image)
                return (
                  <button
                    key={item.id ?? i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      photoFrame,
                      'aspect-[3/4] w-full shrink-0 transition-opacity',
                      i === activeImage ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                    )}
                    aria-label={`Фото ${i + 1}`}
                    aria-current={i === activeImage}
                  >
                    {thumb && <Image src={thumb} alt="" fill quality={85} sizes="80px" className="object-cover" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT PANEL: a plain column, no frame; sticky on desktop (scrolls inside itself on short screens) */}
      <div className="mt-8 lg:sticky lg:top-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mx-2 lg:mt-0 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto lg:px-2 lg:pb-2 lg:[scrollbar-width:thin]">
        {/* The model name in the page-title style; the colour is picked with the swatches below.
            The full title stays in <title> and the structured data. */}
        <h1 className="font-serif text-[30px] leading-[36px] text-ink-text lg:text-[40px] lg:leading-[46px]">
          {shortProductTitle(product.title)}
        </h1>
        <p className="mt-3 text-2xl text-ink lg:mt-4">{formatPrice(product.price)}</p>
        {product.sku && <p className="mt-4 text-xs text-brown/80">Артикул: {product.sku}</p>}
        {/* The composition right by the price: the name says «шовк Армані», shoppers want to know what it is */}
        {facts?.composition && (
          <p className={cn('text-xs text-brown/80', product.sku ? 'mt-1' : 'mt-4')}>Склад: {facts.composition}</p>
        )}
        {materials.length > 0 && (
          <p className={cn('text-xs text-brown/80', product.sku || facts?.composition ? 'mt-1' : 'mt-4')}>
            Матеріал:{' '}
            {materials.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ', '}
                <Link href={`/catalog?material=${m.slug}`} className="underline-offset-2 hover:text-brown hover:underline">
                  {m.title.toLowerCase()}
                </Link>
              </span>
            ))}
          </p>
        )}

        {/* Colors: variant cards (navigate on click) */}
        {showVariantSwitch && (
          <div className="mt-8">
            <p className={label}>
              Колір{product.colorName ? `: ${colorLabel(product.colorName)}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {colorVariants.map((v) => {
                const isCurrent = v.id === product.id
                const name = v.colorName ? colorLabel(v.colorName) : v.title
                const style = { backgroundColor: v.colorHex ?? '#ddd' }
                const unavailable = !isProductInStock(v.sizes)
                const hint = unavailable ? `${name}, немає в наявності` : name
                return isCurrent ? (
                  <span key={v.id} title={hint} aria-label={`${hint} (обраний)`} aria-current="true" className={swatchClass(true, unavailable)} style={style} />
                ) : (
                  <Link key={v.id} href={`/product/${v.slug}`} title={hint} aria-label={hint}>
                    <span className={swatchClass(false, unavailable)} style={style} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Colors: selection inside a single card (model not split into variants) */}
        {!showVariantSwitch && colors.length > 0 && (
          <div className="mt-8">
            <p className={label}>Колір{color ? `: ${colorLabel(color)}` : ''}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {colors.map((c) => (
                <button
                  key={c.id ?? c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  title={colorLabel(c.name)}
                  aria-label={colorLabel(c.name)}
                  aria-pressed={color === c.name}
                  className={swatchClass(color === c.name)}
                  style={{ backgroundColor: c.hex ?? '#ddd' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div
            ref={sizesBlock}
            className={cn(
              'mt-5 scroll-mt-24 rounded-card transition-colors duration-300',
              sizeMissing && '-mx-3 bg-[#f4efeb] px-3 py-3',
            )}
          >
            <p className={label}>
              Розмір
              {sizeMissing && (
                <span role="alert" className="ml-2 font-medium text-[#a0463c]">
                  Оберіть розмір
                </span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id ?? s.value}
                  type="button"
                  onClick={() => handleSelectSize(s.value, s.stock)}
                  disabled={soldOut(s)}
                  aria-pressed={size === s.value}
                  title={soldOut(s) ? 'Немає в наявності' : undefined}
                  className={cn(
                    'flex h-9 min-w-9 items-center justify-center rounded-full border px-2.5 text-xs transition-colors',
                    soldOut(s)
                      ? 'cursor-not-allowed border-[#d4d4d4] text-brown/40 line-through'
                      : size === s.value
                        ? 'border-ink bg-ink text-white'
                        : 'border-[#a3a3a3] text-brown hover:border-ink',
                  )}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <SizeChart html={product.sizeChartHtml} selected={size} />
        </div>

        {/* Quantity only when something can be ordered (quick order: see below) */}
        {!allSoldOut && (
          <div className="mt-5 flex items-center justify-between">
            <p className={label}>Кількість</p>
            <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
          </div>
        )}

        {allSoldOut ? (
          <>
            {/* Sold out: the disabled button stays in the panel on every screen (no sticky bar), with a way out */}
            {addButton('mt-6')}
            {inStockColors.length > 0 && (
              <p className="mt-3 text-sm leading-6 text-brown">
                Цей колір закінчився. Є в наявності:{' '}
                {inStockColors.map((v, i) => (
                  <span key={v.id}>
                    {i > 0 && ', '}
                    <Link href={`/product/${v.slug}`} className="text-ink underline underline-offset-2 hover:no-underline">
                      {v.colorName ? colorLabel(v.colorName).toLowerCase() : v.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </>
        ) : (
          <>
            {/* On desktop the button is in the panel; on mobile it is pinned to the bottom of the screen */}
            {addButton('mt-5 hidden lg:block')}
            <button
              type="button"
              onClick={() => !needsSize() && setQuickOpen(true)}
              className="mt-2 h-10 w-full rounded-card border border-brown/40 text-sm text-brown transition-colors hover:border-brown"
            >
              Купити в 1 клік
            </button>
          </>
        )}

        <BuyInfo facts={facts} />
      </div>

      {description && <div className="mt-12 lg:col-start-1 lg:row-start-2 lg:mt-20">{description}</div>}

      {/* data-sticky-buy: the layout adds bottom padding to <body> so the bar does not cover the footer */}
      {!allSoldOut && (
        <div
          data-sticky-buy
          className="fixed inset-x-0 bottom-0 z-30 border-t border-brown/10 bg-white/95 px-[var(--gutter)] pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
        >
          {addButton('h-12 text-base')}
        </div>
      )}

      {lightboxOpen && (
        <PhotoLightbox
          photos={lightboxPhotos}
          index={Math.min(activeImage, lightboxPhotos.length - 1)}
          onChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      <QuickOrderModal open={quickOpen} onClose={() => setQuickOpen(false)} item={selectedItem} />
    </div>
  )
}
