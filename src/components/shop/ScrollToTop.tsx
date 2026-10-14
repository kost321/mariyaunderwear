'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

/** Round "Back to top" button in the footer. */
export function ScrollToTop() {
  const t = useTranslations('Footer')
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('toTop')}
      className="absolute bottom-16 right-4 opacity-60 transition-opacity hover:opacity-100 lg:bottom-[8px] lg:left-[8px] lg:right-auto"
    >
      {/* The icon in the design is black, so invert it for the dark footer */}
      <Image src="/brand/to-top.svg" alt="" width={64} height={64} className="h-12 w-12 invert lg:h-16 lg:w-16" />
    </button>
  )
}
