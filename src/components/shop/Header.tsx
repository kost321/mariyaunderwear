'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { CONTACTS } from '@/lib/contacts'
import { cn } from '@/lib/utils'
import { MobileMenu, type MenuCategory } from './MobileMenu'

// No "Головна": the logo in the centre already leads home. The mockup's "Бестселери" is called
// "Новинки" until products get a bestseller flag: the link leads to the newest products.
// Used by the desktop nav and the burger menu.
export const NAV_LINKS = [
  { href: '/catalog?sort=new', label: 'Новинки' },
  { href: '/catalog', label: 'Каталог' },
]

const iconButton = 'relative -m-2 flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-70'

/**
 * Store header: navigation on the left (burger on mobile), logo in the center, search and cart on the right.
 * The search icon opens a field under the header that submits to the catalog (/catalog?q=…).
 * Client component because it reads the cart state and opens the menu and the search.
 */
export function Header({ categories }: { categories: MenuCategory[] }) {
  const { totalCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)

  // Focus the field when the search opens; Esc closes it
  useEffect(() => {
    if (!searchOpen) return
    searchInput.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSearchOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  return (
    <header className="bg-white">
      <div className="container grid h-[88px] grid-cols-[1fr_auto_1fr] items-center lg:h-[144px]">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-m-2 p-2 lg:hidden"
            aria-label="Відкрити меню"
          >
            <Image src="/brand/burger.svg" alt="" width={28} height={18} />
          </button>
          <nav className="hidden items-center gap-9 text-base text-brown lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-opacity hover:opacity-70">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* The only link home: aria-label names it for screen readers, so the image itself is decorative */}
        <Link href="/" aria-label="Mariya Underwear, на головну" className="justify-self-center">
          <Image
            src="/brand/logo.jpg"
            alt=""
            width={164}
            height={53}
            priority
            className="h-[34px] w-[105px] mix-blend-darken lg:h-[53px] lg:w-[164px]"
          />
        </Link>

        <div className="flex items-center gap-4 justify-self-end lg:gap-6">
          {/*
            Many orders of a small Ukrainian brand come through Instagram Direct, so the profile is one tap away.
            From sm only: on narrow phones three icons do not fit beside the centred logo; there it is in the burger menu.
          */}
          {CONTACTS.instagram && (
            <a
              href={CONTACTS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={cn(iconButton, 'hidden sm:flex')}
            >
              <Instagram className="h-6 w-6 lg:h-[26px] lg:w-[26px]" strokeWidth={1.25} aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? 'Закрити пошук' : 'Пошук'}
            aria-expanded={searchOpen}
            aria-controls="header-search"
            className={iconButton}
          >
            {searchOpen ? (
              <X className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.25} aria-hidden />
            ) : (
              <Search className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.25} aria-hidden />
            )}
          </button>
          {/* Thin bag icon in a 44px tap area: the old icon sat in a thick grey ring */}
          <Link href="/cart" aria-label={totalCount > 0 ? `Кошик, товарів: ${totalCount}` : 'Кошик'} className={iconButton}>
            <ShoppingBag className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.25} aria-hidden />
            {totalCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-medium text-white">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div id="header-search" className="container pb-6">
          {/* Plain GET form: submitting loads /catalog?q=… as a new page, which also closes the panel */}
          <form action="/catalog" role="search" className="relative">
            <Search className="absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brown" strokeWidth={1.5} aria-hidden />
            <input
              ref={searchInput}
              type="search"
              name="q"
              placeholder="Пошук товарів"
              aria-label="Пошук товарів"
              className="h-[50px] w-full rounded-card bg-cream/70 pl-12 pr-6 text-sm text-ink placeholder:text-brown/70 focus:outline-none focus:ring-1 focus:ring-brown/40"
            />
          </form>
        </div>
      )}

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV_LINKS}
        categories={categories}
      />
    </header>
  )
}

