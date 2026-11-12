import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Product } from '@/payload-types'
import { getMediaUrl, getMediaAlt } from '@/lib/media'
import { isProductInStock } from '@/lib/stock'
import { cn, colorLabel, formatPrice, isLightColor } from '@/lib/utils'

/**
 * Product card: photo with a round "+" button, then the title, the price under it and the colour dot.
 * No category line: in the catalog it repeats the chip that is already selected.
 * A sold-out card says so on the photo and is dimmed, so nobody opens it to find every size crossed out.
 * Server Component, just a link to the product page.
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
  const soldOut = !isProductInStock(product.sizes)

  // A model color card shows its own color (colorHex); otherwise the colors inside the card (colors[])
  const swatch = product.colorName ? product.colorHex : product.colors?.[0]?.hex
  const swatchName = product.colorName ?? product.colors?.[0]?.name
  const extraColors = product.colorName ? 0 : (product.colors?.length ?? 0) - 1

  return (
    // flex-col + flex-1 below: cards in a row share the row height, so the prices line up at the bottom
    <Link href={`/product/${product.slug}`} className={cn('group flex flex-col', className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-[#d7d7d7]/60 bg-placeholder/40">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes={sizes}
            quality={90}
            className={cn(
              'object-cover transition-transform duration-500 group-hover:scale-105',
              soldOut && 'opacity-60 grayscale-[40%]',
            )}
          />
        ) : (
          <div className={cn('flex h-full items-center justify-center text-sm text-brown/60', soldOut && 'opacity-50')}>
            немає фото
          </div>
        )}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs text-ink shadow-[0_2px_8px_rgba(64,56,52,0.15)]">
            Немає в наявності
          </span>
        ) : (
          /*
            Solid white with a shadow: the old semi-transparent brown looked dark on the grey placeholder
            but melted into photos. White stays visible on light and dark garments alike.
          */
          <span className="absolute bottom-3 left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_8px_rgba(64,56,52,0.25)] transition-colors group-hover:bg-ink group-hover:text-white">
            <Plus className="h-4 w-4" strokeWidth={1.25} />
          </span>
        )}
      </div>

      {/* flex-1 + mt-auto: the price row sits at the same height in every card of a row, however many lines the title takes */}
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <h3 className={cn('text-sm leading-5 sm:text-[15px] sm:leading-[22px]', soldOut ? 'text-ink/60' : 'text-ink')}>
          {product.title}
        </h3>
        <div className="mt-auto flex items-center gap-2.5">
          <p className="whitespace-nowrap text-sm leading-5 text-brown sm:text-[15px] sm:leading-[22px]">
            {formatPrice(product.price)}
          </p>
          {swatch && (
            <span className="flex items-center gap-1 text-[11px] text-brown/80">
              <span
                className={cn('h-3 w-3 rounded-full border', isLightColor(swatch) ? 'border-brown/40' : 'border-transparent')}
                style={{ backgroundColor: swatch }}
                {...(swatchName && { title: colorLabel(swatchName) })}
              />
              {extraColors > 0 && `+${extraColors}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
