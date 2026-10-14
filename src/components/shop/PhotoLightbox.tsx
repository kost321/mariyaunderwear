'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

export type LightboxPhoto = { url: string; alt: string }

/**
 * Full-screen photo viewer: closes on ×, backdrop click or Esc;
 * ←/→ keys, arrow buttons and a swipe switch photos.
 */
export function PhotoLightbox({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: LightboxPhoto[]
  index: number
  onChange: (index: number) => void
  onClose: () => void
}) {
  const touchStartX = useRef<number | null>(null)
  const count = photos.length
  const photo = photos[index]

  const go = (delta: number) => onChange((index + delta + count) % count)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (count > 1 && e.key === 'ArrowLeft') onChange((index - 1 + count) % count)
      else if (count > 1 && e.key === 'ArrowRight') onChange((index + 1) % count)
    }
    window.addEventListener('keydown', onKey)
    // Lock page scroll while the viewer is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, count, onChange, onClose])

  if (!photo) return null

  const arrow =
    'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl text-ink transition-colors hover:bg-white'

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/90"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || count < 2) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фото"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center text-4xl leading-none text-white/80 hover:text-white"
        aria-label="Закрити"
      >
        ×
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            className={`${arrow} left-3 lg:left-8`}
            aria-label="Попереднє фото"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            className={`${arrow} right-3 lg:right-8`}
            aria-label="Наступне фото"
          >
            ›
          </button>
        </>
      )}

      <div className="absolute inset-x-4 inset-y-16 lg:inset-x-24" onClick={(e) => e.stopPropagation()}>
        <Image
          key={photo.url}
          src={photo.url}
          alt={photo.alt}
          fill
          quality={90}
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {count > 1 && (
        <p className="absolute inset-x-0 bottom-5 text-center text-xs tracking-[2px] text-white/70">
          {index + 1} / {count}
        </p>
      )}
    </div>
  )
}
