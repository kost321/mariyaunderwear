import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { cn, formatPrice } from '@/lib/utils'

/**
 * Product card: photo with a round "+" button, category and color above
 * the title, price on the right. Server Component, just a link to the product page.
 */
export function ProductCard({
  product,
  sizes = '(max-width: 768px) 50vw, 33vw',
  className,
}: {
  product: Product
  sizes?: string
  className?: string
}) {
  // Take the first image from the gallery.
  const firstImage = product.images?.[0]?.image
  const url = getMediaUrl(firstImage)
  const alt = getMediaAlt(firstImage, product.title)
  const category = typeof product.category === 'object' ? product.category.title : null

  // Colors inside the card (colors[]) or the model variant color (colorHex)
  const swatch = product.colors?.[0]?.hex ?? product.colorHex
  const extraColors = (product.colors?.length ?? 0) - 1

  return (
    <Link href={`/product/${product.slug}`} className={cn('group block', className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes={sizes}
            quality={85}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brown/60">немає фото</div>
        )}
        <span className="absolute bottom-3 left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full bg-brown/50 text-ink transition-colors group-hover:bg-ink group-hover:text-white">
          <Plus className="h-4 w-4" strokeWidth={1.25} />
        </span>
      </div>

      {/* On narrow cards the price goes under the title, from sm it goes to the right */}
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pr-2">
        <div className="min-w-0">
          {(category || swatch) && (
            <div className="flex items-center gap-4 text-xs text-brown/50">
              {category && <span className="truncate">{category}</span>}
              {swatch && (
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-light text-black/65">
                  <span className="h-3 w-3 border border-brown/30" style={{ backgroundColor: swatch }} />
                  {extraColors > 0 && `+${extraColors}`}
                </span>
              )}
            </div>
          )}
          <h3 className="mt-1 font-serif text-sm leading-[17px] text-ink sm:text-base sm:leading-[19px]">{product.title}</h3>
        </div>
        <p className="shrink-0 whitespace-nowrap font-serif text-sm leading-[17px] text-ink/50 sm:text-base sm:leading-[19px]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
