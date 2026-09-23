'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SizeChart } from '@/components/shop/SizeChart'
import { ProductAccordion } from '@/components/shop/ProductAccordion'
import { QuickOrderModal } from '@/components/shop/QuickOrderModal'
import { ProductCard } from '@/components/shop/ProductCard'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/types/shop'

/**
 * Интерактивная часть карточки товара:
 *  - галерея с выбором активного изображения;
 *  - выбор размера и цвета;
 *  - добавление в корзину.
 *
 * Данные приходят пропсом из серверного page.tsx, поэтому этот
 * клиентский компонент сам ничего не запрашивает.
 */
export function ProductDetails({
  product,
  colorVariants = [],
  relatedProducts = [],
}: {
  product: Product
  /** Другие цветовые карточки той же модели (связаны полем model). */
  colorVariants?: Product[]
  /** Товары, вручную выбранные в админке для блока «Схожі товари». */
  relatedProducts?: Product[]
}) {
  const t = useTranslations('Product')
  const tc = useTranslations('Common')
  const { addItem } = useCart()

  const images = product.images ?? []
  const sizes = product.sizes ?? []
  const colors = product.colors ?? []

  // Показываем переключатель-ссылки только если у модели есть хотя бы 2 цвета-карточки.
  const showVariantSwitch = colorVariants.length > 1

  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState<string | undefined>(sizes[0]?.value)
  const [color, setColor] = useState<string | undefined>(colors[0]?.name)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)

  const mainImage = images[activeImage]?.image
  const mainUrl = getMediaUrl(mainImage)
  const mainAlt = getMediaAlt(mainImage, product.title ?? '')

  // Позиция для корзины / быстрого заказа из текущего выбора на странице.
  const selectedItem: CartItem = {
    productId: String(product.id),
    title: product.title ?? '',
    price: product.price,
    slug: product.slug ?? '',
    image: getMediaUrl(images[0]?.image),
    size,
    // Если модель разбита на цветовые карточки — цвет берём из карточки,
    // иначе из старого массива colors (выбор внутри страницы).
    color: showVariantSwitch ? (product.colorName ?? undefined) : color,
    quantity,
  }

  function handleAddToCart() {
    addItem(selectedItem)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
    <div className="grid gap-8 md:grid-cols-2">
      {/* ГАЛЕРЕЯ */}
      <div className="space-y-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          {mainUrl ? (
            <Image
              src={mainUrl}
              alt={mainAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {tc('noPhoto')}
            </div>
          )}
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((item, i) => {
              const thumb = getMediaUrl(item.image)
              if (!thumb) return null
              return (
                <button
                  key={item.id ?? i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-md border-2',
                    i === activeImage ? 'border-primary' : 'border-transparent',
                  )}
                  aria-label={t('image', { n: i + 1 })}
                >
                  <Image src={thumb} alt="" fill sizes="20vw" className="object-cover" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ИНФОРМАЦИЯ И ВЫБОР */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="mt-2 text-2xl">{formatPrice(product.price, tc('currency'))}</p>
          {product.sku && (
            <p className="mt-1 text-sm text-muted-foreground">{t('sku', { sku: product.sku })}</p>

          )}
        </div>

        {/* Размеры */}
        {sizes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{t('size')}</p>
              <SizeChart html={product.sizeChartHtml} />
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id ?? s.value}
                  onClick={() => setSize(s.value)}
                  className={cn(
                    'min-w-12 rounded-md border px-3 py-2 text-sm transition-colors',
                    size === s.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Розмірна таблиця, якщо розмірів немає, але таблиця задана */}
        {sizes.length === 0 && product.sizeChartHtml && (
          <SizeChart html={product.sizeChartHtml} />
        )}

        {/* Цвета: варианты-карточки (переход по клику) */}
        {showVariantSwitch && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('color')}{product.colorName ? `: ${product.colorName}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {colorVariants.map((v) => {
                const isCurrent = v.id === product.id
                const label = v.colorName ?? v.title ?? ''
                const swatchClass = cn(
                  'block h-9 w-9 rounded-full border-2 transition-transform',
                  isCurrent
                    ? 'border-primary scale-110'
                    : 'border-border hover:scale-105',
                )
                const style = { backgroundColor: v.colorHex ?? '#ddd' }

                return isCurrent ? (
                  <span
                    key={v.id}
                    title={label}
                    aria-label={t('selected', { label })}
                    aria-current="true"
                    className={swatchClass}
                    style={style}
                  />
                ) : (
                  <Link
                    key={v.id}
                    href={`/product/${v.slug}`}
                    title={label}
                    aria-label={label}
                  >
                    <span className={swatchClass} style={style} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Цвета: выбор внутри одной карточки (когда модель не разбита на варианты) */}
        {!showVariantSwitch && colors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('color')}{color ? `: ${color}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.id ?? c.name}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 transition-transform',
                    color === c.name
                      ? 'border-primary scale-110'
                      : 'border-border',
                  )}
                  style={{ backgroundColor: c.hex ?? '#ddd' }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Кількість + додати в кошик */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-11 w-11 items-center justify-center text-lg leading-none disabled:opacity-40"
              aria-label={t('decrease')}
            >
              −
            </button>
            <span
              className="min-w-10 text-center text-sm tabular-nums"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center text-lg leading-none"
              aria-label={t('increase')}
            >
              +
            </button>
          </div>

          <Button onClick={handleAddToCart} size="lg" className="flex-1 sm:flex-none">
            {added ? t('added') : t('buy')}
          </Button>
        </div>

        <Button
          onClick={() => setQuickOpen(true)}
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
        >
          {t('quickOrder')}
        </Button>

        {/* Опис + Характеристика + Догляд — акордеон */}
        <ProductAccordion
          sections={[
            { title: t('description'), html: product.description },
            { title: t('specs'), html: product.descriptionHtml },
            { title: t('care'), html: product.careHtml },
          ]}
        />
      </div>

      <QuickOrderModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        item={selectedItem}
      />
    </div>

    {/* Схожі товари — вручну обрані в адмінці */}
    {relatedProducts.length > 0 && (
      <div className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">{t('related')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {relatedProducts.map((related) => (
            <ProductCard key={related.id} product={related} />
          ))}
        </div>
      </div>
    )}
    </>
  )
}
