import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { HeroVariant } from './HeroSection'

const VARIANTS: { id: HeroVariant; label: string }[] = [
  { id: 'a', label: 'A · одне фото' },
  { id: 'b', label: 'B · два фото' },
  { id: 'c', label: 'C · банер' },
]

/**
 * Demo-only floating switch between first-screen layouts. Rendered only when the URL has ?hero=…,
 * so regular visitors never see it; they always get the default layout.
 * Remove together with the unused variants once the client has chosen.
 */
export function HeroVariantSwitch({ active }: { active: HeroVariant }) {
  return (
    <nav
      aria-label="Варіанти першого екрана"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full bg-ink/90 p-1 text-sm shadow-lg backdrop-blur"
    >
      {VARIANTS.map((v) => (
        <Link
          key={v.id}
          href={`/?hero=${v.id}`}
          scroll={false}
          aria-current={v.id === active ? 'page' : undefined}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 transition-colors',
            v.id === active ? 'bg-white text-ink' : 'text-white/80 hover:text-white',
          )}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  )
}
