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

  // A model color card shows its own color (colorHex); otherwise the colors inside the card (colors[])
  const swatch = product.colorName ? product.colorHex : product.colors?.[0]?.hex
  const extraColors = product.colorName ? 0 : (product.colors?.length ?? 0) - 1

  return (
    // flex-col + flex-1 below: cards in a row share the row height, so the mobile price can sit at the bottom
    <Link href={`/product/${product.slug}`} className={cn('group flex flex-col', className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes={sizes}
            quality={90}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brown/60">немає фото</div>
        )}
        <span className="absolute bottom-3 left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full bg-brown/50 text-ink transition-colors group-hover:bg-ink group-hover:text-white">
          <Plus className="h-4 w-4" strokeWidth={1.25} />
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
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
        {/*
          The price sits at the same height in every card of a row, however many lines the title takes:
          on narrow cards it goes under the title and is pushed to the bottom of the card (mt-auto);
          from sm it goes to the right, lined up with the FIRST line of the title (items-baseline).
        */}
        <div className="mt-1 flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 sm:pr-2">
          <h3 className="min-w-0 font-serif text-sm leading-[17px] text-ink sm:text-base sm:leading-[19px]">{product.title}</h3>
          <p className="mt-auto shrink-0 whitespace-nowrap font-serif text-sm leading-[17px] text-ink/50 sm:mt-0 sm:text-base sm:leading-[19px]">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  )
}
