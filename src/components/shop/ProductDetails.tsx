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
 * Интерактивная часть карточки товара (макет Figma «Product»):
 *  - галерея: большое фото + колонка миниатюр (на мобилке — лента под фото);
 *  - карточка в рамке: название, цена, цвет, размер, «Додати в кошик»;
 *  - быстрый заказ. Описание — под галереей (ProductDescription в page.tsx).
 *
 * Данные приходят пропсом из серверного page.tsx, поэтому этот
 * клиентский компонент сам ничего не запрашивает.
 */
export function ProductDetails({
  product,
  colorVariants = [],
}: {
  product: Product
  /** Другие цветовые карточки той же модели (связаны полем model). */
  colorVariants?: Product[]
}) {
  const { addItem } = useCart()

  const images = product.images ?? []
  const sizes = product.sizes ?? []
  const colors = product.colors ?? []

  // Показываем переключатель-ссылки только если у модели есть хотя бы 2 цвета-карточки.
  const showVariantSwitch = colorVariants.length > 1

  const [activeImage, setActiveImage] = useState(0)
  // stock === 0 — розмір закінчився; порожнє значення = залишок невідомий.
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

  // Позиция для корзины / быстрого заказа из текущего выбора на странице.
  const selectedItem: CartItem = {
    productId: String(product.id),
    title: product.title,
    price: product.price,
    slug: product.slug ?? '',
    image: getMediaUrl(images[0]?.image),
    size,
    // Если модель разбита на цветовые карточки — цвет берём из карточки,
    // иначе из старого массива colors (выбор внутри страницы).
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
      {/* ГАЛЕРЕЯ: на мобілці фото на всю ширину, мініатюри стрічкою під ним */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-10 lg:pt-[30px]">
        <div className="relative -mx-[var(--gutter)] aspect-[3/4] overflow-hidden rounded-b-card border-b border-[#d9d9d9] bg-placeholder/40 lg:mx-0 lg:w-[367px] lg:rounded-card lg:border">

          {mainUrl && <Image src={mainUrl} alt={mainAlt} fill priority sizes="(max-width: 1024px) 100vw, 367px" className="object-cover" />}
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
                  {thumb && <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* КАРТКА ТОВАРУ: на десктопі в рамці, як у макеті */}
      <div className="mt-8 lg:mt-0 lg:w-[340px] lg:border lg:border-brown lg:px-10 lg:pb-3 lg:pt-14">
        <h1 className="font-serif text-sm uppercase leading-[17px] tracking-[1px] text-ink">{product.title}</h1>
        <p className="mt-3 text-sm tracking-[1px] text-brown">{formatPrice(product.price)}</p>
        {product.sku && <p className="mt-6 text-xs tracking-[1px] text-brown/50">Артикул: {product.sku}</p>}

        {/* Кольори: варіанти-картки (перехід за кліком) */}
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

        {/* Кольори: вибір усередині однієї картки (модель не розбита на варіанти) */}
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

        {/* Розміри */}
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

        {/* Кількість */}
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

        {/* На десктопі кнопка в картці; на мобілці — закріплена знизу екрана */}
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
