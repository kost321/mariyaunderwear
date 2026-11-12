'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { cn, colorLabel, formatPrice, shortProductTitle } from '@/lib/utils'
import { sortByColor } from '@/lib/colors'
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
 *  - gallery (~58% of the width on desktop): large photo with a column of thumbnails on its left
 *    (a strip under the photo on mobile, the photo within the content margins under the breadcrumbs);
 *  - product panel: title, price, color, size, "Add to cart";
 *  - quick order. The description sits under the gallery (ProductDescription in page.tsx).
 *
 * Data arrives as props from the server page.tsx, so this
 * client component does not fetch anything itself.
 */
export function ProductDetails({
  product,
  colorVariants = [],
}: {
  product: Product
  /** Other color cards of the same model (linked by the model field). */
  colorVariants?: Product[]
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
  const [size, setSize] = useState<string | undefined>(
    (sizes.find((s) => !soldOut(s)) ?? sizes[0])?.value,
  )
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
    if (typeof stock === 'number' && stock > 0) setQuantity((q) => Math.min(q, stock))
  }

  function handleAddToCart() {
    if (allSoldOut) return
    addItem(selectedItem)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // A sold-out colour is dimmed and crossed by a diagonal (dark with a white edge, so it shows on any colour)
  const swatchClass = (active: boolean, unavailable = false) =>
    cn(
      'relative block h-9 w-9 rounded-full border transition-transform',
      active ? 'border-ink ring-1 ring-ink ring-offset-2' : 'border-brown/30 hover:scale-105',
      unavailable &&
        "opacity-50 after:absolute after:left-1/2 after:top-[-3px] after:h-[calc(100%+6px)] after:w-[1.5px] after:-translate-x-1/2 after:rotate-45 after:bg-ink after:shadow-[0_0_0_1px_white] after:content-['']",
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
    // Desktop: the gallery takes ~58% of the width (for clothes the photo is the main argument), thumbnails
    // in a column on its left; the product panel is a plain column whose top lines up with the photo.
    <div className="lg:grid lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start lg:gap-12 xl:gap-16">
      {/* GALLERY: on mobile the photo within the content margins, thumbnails as a strip under it */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:gap-4">
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
            <div className="-mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] lg:absolute lg:inset-0 lg:mx-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 [&::-webkit-scrollbar]:hidden">
              {images.map((item, i) => {
                const thumb = getMediaUrl(item.image)
                return (
                  <button
                    key={item.id ?? i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      photoFrame,
                      'aspect-[3/4] w-16 shrink-0 transition-opacity lg:w-full',
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

      {/* PRODUCT PANEL: a plain column, no frame */}
      <div className="mt-8 lg:mt-0">
        {/* The model name in the page-title style; the colour is picked with the swatches below.
            The full title stays in <title> and the structured data. */}
        <h1 className="font-serif text-[30px] leading-[36px] text-ink-text lg:text-[40px] lg:leading-[46px]">
          {shortProductTitle(product.title)}
        </h1>
        <p className="mt-3 text-2xl text-ink lg:mt-4">{formatPrice(product.price)}</p>
        {product.sku && <p className="mt-6 text-xs text-brown/80">Артикул: {product.sku}</p>}
        {materials.length > 0 && (
          <p className={cn('text-xs text-brown/80', product.sku ? 'mt-1' : 'mt-6')}>
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
          <div className="mt-10">
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
          <div className="mt-10">
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
          <div className="mt-5">
            <p className={label}>Розмір</p>
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
          <SizeChart html={product.sizeChartHtml} />
        </div>

        {/* Quantity only when something can be ordered (quick order: see below) */}
        {!allSoldOut && (
          <div className="mt-5 flex items-center justify-between">
            <p className={label}>Кількість</p>
            <div className="flex items-center rounded-full border border-[#a3a3a3] px-1 text-sm text-ink">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-8 w-8 items-center justify-center disabled:opacity-40"
                aria-label="Зменшити кількість"
              >
                −
              </button>
              <span className="min-w-6 text-center tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="flex h-8 w-8 items-center justify-center disabled:opacity-40"
                aria-label="Збільшити кількість"
              >
                +
              </button>
            </div>
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
              onClick={() => setQuickOpen(true)}
              className="mt-2 h-10 w-full rounded-card border border-brown/40 text-sm text-brown transition-colors hover:border-brown"
            >
              Купити в 1 клік
            </button>
          </>
        )}
      </div>

      {/* data-sticky-buy: the layout adds bottom padding to <body> so the bar does not cover the footer */}
      {!allSoldOut && (
        <div data-sticky-buy className="fixed inset-x-0 bottom-0 z-30 bg-white/95 p-2 backdrop-blur lg:hidden">
          {addButton('h-[57px] rounded-none')}
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
