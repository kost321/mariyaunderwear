import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { formatPrice } from '@/lib/utils'

/**
 * Карточка товара в сетке каталога. Server Component — без интерактива,
 * только ссылка на страницу товара.
 */
export function ProductCard({ product }: { product: Product }) {
  // Берём первое изображение из галереи.
  const firstImage = product.images?.[0]?.image
  const url = getMediaUrl(firstImage, 'card')
  const alt = getMediaAlt(firstImage, product.title)

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            нет фото
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight">{product.title}</h3>
        <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
