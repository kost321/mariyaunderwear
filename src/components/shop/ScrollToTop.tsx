'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { scrollBehavior } from '@/lib/utils'

/** Round "Back to top" button in the footer, in the bottom-right corner where it covers no links. */
export function ScrollToTop() {
  const t = useTranslations('Footer')
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
      aria-label={t('toTop')}
      className="absolute bottom-6 right-4 opacity-60 transition-opacity hover:opacity-100 lg:bottom-6 lg:right-6"
    >
      {/* The icon in the design is black, so invert it for the dark footer */}
      <Image src="/brand/to-top.svg" alt="" width={64} height={64} className="h-12 w-12 invert lg:h-16 lg:w-16" />
    </button>
  )
}
