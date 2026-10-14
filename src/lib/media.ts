import type { Media } from '@/payload-types'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzbov07se'

export function getMediaUrl(
  media: number | string | Media | null | undefined,
): string | undefined {
  if (!media || typeof media !== 'object') return undefined

  // If there is a full URL (https://...), return it as is
  if (media.url && media.url.startsWith('http')) return media.url

  // If there is a filename, build the Cloudinary URL
  if (media.filename) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${media.filename}`
  }

  return media.url ?? undefined
}

/** Image alt text (for next/image and SEO). */
export function getMediaAlt(
  media: number | string | Media | null | undefined,
  fallback = '',
): string {
  if (media && typeof media === 'object' && media.alt) return media.alt
  return fallback
}
