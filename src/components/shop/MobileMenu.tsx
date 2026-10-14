'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MenuCategory = { slug: string; title: string }

/**
 * Side menu opened by the burger: navigation + catalog categories.
 */
export function MobileMenu({
  open,
  onClose,
  links,
  categories,
}: {
  open: boolean
  onClose: () => void
  links: { href: string; label: string }[]
  categories: MenuCategory[]
}) {
  // Esc closes the menu; the page underneath does not scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      className={cn('fixed inset-0 z-50 transition-opacity', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(360px,85vw)] flex-col overflow-y-auto bg-white px-8 py-8 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button type="button" onClick={onClose} className="-m-2 self-end p-2 text-brown" aria-label="Закрити меню">
          <X className="h-6 w-6" strokeWidth={1.5} />
        </button>

        <nav className="mt-6 flex flex-col gap-5 font-serif text-2xl uppercase tracking-[2px] text-ink-text">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose}>
              {link.label}
            </Link>
          ))}
        </nav>

        {categories.length > 0 && (
          <div className="mt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-pink">Категорії</p>
            <ul className="mt-4 flex flex-col gap-3 text-base tracking-[1px] text-brown">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/catalog?category=${c.slug}`} onClick={onClose} className="hover:opacity-70">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
