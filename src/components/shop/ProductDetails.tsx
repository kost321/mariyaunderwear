'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { formatPrice, cn } from '@/lib/utils'
import { SizeChart } from '@/components/shop/SizeChart'
import { QuickOrderModal } from '@/components/shop/QuickOrderModal'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/types/shop'

const photoFrame = 'relative overflow-hidden rounded-card border border-[#d9d9d9] bg-placeholder/40'

/**
 * Interactive part of the product card (Figma design "Product"):
 *  - gallery: large photo + a column of thumbnails (a strip under the photo on mobile);
 *  - framed card: title, price, color, size, "Add to cart";
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
  const colors = product.colors ?? []

  // Show the switcher links only if the model has at least 2 color cards.
  const showVariantSwitch = colorVariants.length > 1

  const [activeImage, setActiveImage] = useState(0)
  // stock === 0 means the size is sold out; empty value = stock unknown.
  const soldOut = (s: { stock?: number | null }) => s.stock === 0
  const allSoldOut = sizes.length > 0 && sizes.every(soldOut)
  const [size, setSize] = useState<string | undefined>(
    (sizes.find((s) => !soldOut(s)) ?? sizes[0])?.value,
  )
  const [color, setColor] = useState<string | undefined>(colors[0]?.name)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)

  const selectedStock = sizes.find((s) => s.value === size)?.stock
  const maxQuantity = typeof selectedStock === 'number' && selectedStock > 0 ? selectedStock : 99

  const mainImage = images[activeImage]?.image
  const mainUrl = getMediaUrl(mainImage)
  const mainAlt = getMediaAlt(mainImage, product.title)

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

  const swatchClass = (active: boolean) =>
    cn(
      'block h-9 w-9 rounded-full border transition-transform',
      active ? 'border-ink ring-1 ring-ink ring-offset-2' : 'border-brown/30 hover:scale-105',
    )

  const label = 'text-xs tracking-[2px] text-ink'

  const addButton = (className?: string) => (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={allSoldOut}
      className={cn(
        'h-10 w-full rounded-card bg-cream/70 text-xs uppercase tracking-[1px] text-brown transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-cream/70',
        className,
      )}
    >
      {allSoldOut ? 'Немає в наявності' : added ? 'Додано ✓' : 'Додати в кошик'}
    </button>
  )

  return (
    <div className="lg:flex lg:items-start lg:justify-center lg:gap-[100px]">
      {/* GALLERY: full-width photo on mobile, thumbnails as a strip under it */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-10 lg:pt-[30px]">
        <div className="relative -mx-[var(--gutter)] aspect-[3/4] overflow-hidden rounded-b-card border-b border-[#d9d9d9] bg-placeholder/40 lg:mx-0 lg:w-[367px] lg:rounded-card lg:border">

          {mainUrl && <Image src={mainUrl} alt={mainAlt} fill priority quality={85} sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />}
        </div>

        {images.length > 1 && (
          <div className="-mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] lg:mx-0 lg:max-h-[438px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:px-0">
            {images.map((item, i) => {
              const thumb = getMediaUrl(item.image)
              return (
                <button
                  key={item.id ?? i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    photoFrame,
                    'h-[78px] w-16 shrink-0 transition-opacity',
                    i === activeImage ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                  )}
                  aria-label={`Фото ${i + 1}`}
                  aria-current={i === activeImage}
                >
                  {thumb && <Image src={thumb} alt="" fill quality={85} sizes="64px" className="object-cover" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* PRODUCT CARD: framed on desktop, as in the design */}
      <div className="mt-8 lg:mt-0 lg:w-[340px] lg:border lg:border-brown lg:px-10 lg:pb-3 lg:pt-14">
        <h1 className="font-serif text-sm uppercase leading-[17px] tracking-[1px] text-ink">{product.title}</h1>
        <p className="mt-3 text-sm tracking-[1px] text-brown">{formatPrice(product.price)}</p>
        {product.sku && <p className="mt-6 text-xs tracking-[1px] text-brown/50">Артикул: {product.sku}</p>}

        {/* Colors: variant cards (navigate on click) */}
        {showVariantSwitch && (
          <div className="mt-10">
            <p className={label}>
              Колір{product.colorName ? `: ${product.colorName}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {colorVariants.map((v) => {
                const isCurrent = v.id === product.id
                const name = v.colorName ?? v.title
                const style = { backgroundColor: v.colorHex ?? '#ddd' }
                return isCurrent ? (
                  <span key={v.id} title={name} aria-label={`${name} (обраний)`} aria-current="true" className={swatchClass(true)} style={style} />
                ) : (
                  <Link key={v.id} href={`/product/${v.slug}`} title={name} aria-label={name}>
                    <span className={swatchClass(false)} style={style} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Colors: selection inside a single card (model not split into variants) */}
        {!showVariantSwitch && colors.length > 0 && (
          <div className="mt-10">
            <p className={label}>Колір{color ? `: ${color}` : ''}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {colors.map((c) => (
                <button
                  key={c.id ?? c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  aria-label={c.name}
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
            <div className="mt-2 flex flex-wrap gap-1">
              {sizes.map((s) => (
                <button
                  key={s.id ?? s.value}
                  type="button"
                  onClick={() => handleSelectSize(s.value, s.stock)}
                  disabled={soldOut(s)}
                  aria-pressed={size === s.value}
                  title={soldOut(s) ? 'Немає в наявності' : undefined}
                  className={cn(
                    'flex h-9 min-w-[35px] items-center justify-center border px-1.5 text-[10px] transition-colors',
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

        <div className="mt-3 text-center">
          <SizeChart html={product.sizeChartHtml} />
        </div>

        {/* Quantity */}
        <div className="mt-5 flex items-center justify-between">
          <p className={label}>Кількість</p>
          <div className="flex items-center border border-[#a3a3a3] text-sm text-ink">
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

        {/* On desktop the button is inside the card; on mobile it is pinned to the bottom of the screen */}
        {addButton('mt-5 hidden lg:block')}
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          disabled={allSoldOut}
          className="mt-2 h-10 w-full rounded-card border border-brown/40 text-xs uppercase tracking-[1px] text-brown transition-colors hover:border-brown disabled:cursor-not-allowed disabled:opacity-50"
        >
          Купити в 1 клік
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 p-2 backdrop-blur lg:hidden">
        {addButton('h-[57px] rounded-none')}
      </div>

      <QuickOrderModal open={quickOpen} onClose={() => setQuickOpen(false)} item={selectedItem} />
    </div>
  )
}
