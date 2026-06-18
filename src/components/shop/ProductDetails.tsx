'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'

/**
 * Интерактивная часть карточки товара:
 *  - галерея с выбором активного изображения;
 *  - выбор размера и цвета;
 *  - добавление в корзину.
 *
 * Данные приходят пропсом из серверного page.tsx, поэтому этот
 * клиентский компонент сам ничего не запрашивает.
 */
export function ProductDetails({ product }: { product: Product }) {
  const { addItem } = useCart()

  const images = product.images ?? []
  const sizes = product.sizes ?? []
  const colors = product.colors ?? []

  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState<string | undefined>(sizes[0]?.value)
  const [color, setColor] = useState<string | undefined>(colors[0]?.name)
  const [added, setAdded] = useState(false)

  const mainImage = images[activeImage]?.image
  const mainUrl = getMediaUrl(mainImage)
  const mainAlt = getMediaAlt(mainImage, product.title)

  function handleAddToCart() {
    addItem({
      productId: String(product.id),
      title: product.title,
      price: product.price,
      slug: product.slug ?? '',
      image: getMediaUrl(images[0]?.image),
      size,
      color,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
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
              немає фото
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
                  aria-label={`Изображение ${i + 1}`}
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
          <p className="mt-2 text-2xl">{formatPrice(product.price)}</p>
          {product.sku && (
            <p className="mt-1 text-sm text-muted-foreground">Артикул: {product.sku}</p>

          )}
        </div>

        {/* Размеры */}
        {sizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Розмір</p>
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

        {/* Цвета */}
        {colors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Колір{color ? `: ${color}` : ''}
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

        <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto">
          {added ? 'Додано ✓' : 'До кошика'}
        </Button>
      </div>
    </div>
  )
}
