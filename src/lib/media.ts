import type { Media } from '@/payload-types'

/**
 * Поля upload в Payload при depth>0 приходят как объект Media,
 * а при depth=0 — как id (number/string). Этот хелпер аккуратно
 * достаёт URL нужного размера, не падая на промежуточных вариантах.
 */
export function getMediaUrl(
  media: number | string | Media | null | undefined,
  size?: 'thumbnail' | 'card' | 'full',
): string | undefined {
  if (!media || typeof media !== 'object') return undefined

  if (size && media.sizes?.[size]?.url) {
    return media.sizes[size]!.url ?? undefined
  }
  return media.url ?? undefined
}

/** Alt-текст изображения (для next/image и SEO). */
export function getMediaAlt(
  media: number | string | Media | null | undefined,
  fallback = '',
): string {
  if (media && typeof media === 'object' && media.alt) return media.alt
  return fallback
}
