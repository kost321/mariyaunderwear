'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Instagram, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { CONTACTS } from '@/lib/contacts'
import { useModalFocus } from '@/hooks/useModalFocus'
import { LanguageSwitcher } from './LanguageSwitcher'

export type MenuCategory = { slug: string; title: string }

/**
 * Side menu opened by the burger: navigation + catalog categories.
 * Closed, it stays in the DOM for the slide animation but is `inert`: its links are out of the Tab order
 * and hidden from screen readers. Open, the focus moves into it and stays there (useModalFocus).
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
  const t = useTranslations('Header')
  const panel = useModalFocus<HTMLElement>(open)

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
      inert={!open}
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(360px,85vw)] flex-col overflow-y-auto bg-white px-8 py-8 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button type="button" onClick={onClose} className="-m-2.5 self-end p-2.5 text-brown" aria-label={t('closeMenu')}>
          <X className="h-6 w-6" strokeWidth={1.5} />
        </button>

        <nav className="mt-6 flex flex-col gap-2 font-serif text-2xl text-ink-text">
          {links.map((link) => (
            // 32px line + py-1.5 = a 44px tap target; gap-2 keeps the old 20px between the words
            <Link key={link.href} href={link.href} onClick={onClose} className="py-1.5">
              {link.label}
            </Link>
          ))}
        </nav>

        {categories.length > 0 && (
          <div className="mt-10">
            <p className="text-sm text-brown">{t('categories')}</p>
            <ul className="mt-2 flex flex-col text-base text-brown">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/catalog?category=${c.slug}`} onClick={onClose} className="block py-2.5 hover:opacity-70">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-6 pt-10">
          {/* The header shows the language switch only on desktop */}
          <div className="-mx-1.5 text-sm">
            <LanguageSwitcher />
          </div>
          {/* On narrow phones the header has no room for the Instagram icon, so it lives here */}
          {CONTACTS.instagram && (
            <a
              href={CONTACTS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-base text-brown hover:text-ink"
            >
              <Instagram className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              {t('instagram')}
            </a>
          )}
        </div>
      </aside>
    </div>
  )
}
