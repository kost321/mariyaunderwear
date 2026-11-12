'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { CONTACTS } from '@/lib/contacts'
import { cn } from '@/lib/utils'
import { HeaderSearch } from './HeaderSearch'
import { MobileMenu, type MenuCategory } from './MobileMenu'

// "Головна · Бестселери · Каталог" as in the mockup, plus "Новинки" (the newest products).
// "Бестселери" are products ticked in the admin; the link is hidden until there is at least one.
// Used by the desktop nav and the burger menu.
const BESTSELLERS_LINK = { href: '/catalog?bestseller=1', label: 'Бестселери' }

function navLinks(showBestsellers: boolean) {
  return [
    { href: '/', label: 'Головна' },
    ...(showBestsellers ? [BESTSELLERS_LINK] : []),
    { href: '/catalog?sort=new', label: 'Новинки' },
    { href: '/catalog', label: 'Каталог' },
  ]
}

const iconButton = 'relative -m-2 flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-70'

/**
 * Store header: navigation on the left (burger on mobile), logo in the center, search and cart on the right.
 * Search: in the catalog the icon focuses the catalog's own search field (CatalogSearch, id "catalog-search");
 * on other pages it drops a panel with live results over the page (HeaderSearch).
 * Client component because it reads the cart state and opens the menu and the search.
 */
export function Header({ categories, showBestsellers }: { categories: MenuCategory[]; showBestsellers: boolean }) {
  const links = navLinks(showBestsellers)
  const { totalCount } = useCart()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  // Any navigation (a picked result, Enter, a header link) closes the panel
  useEffect(() => setSearchOpen(false), [pathname])

  function onSearchClick() {
    const field = pathname === '/catalog' ? document.getElementById('catalog-search') : null
    if (field) {
      field.scrollIntoView({ block: 'center', behavior: 'smooth' })
      field.focus({ preventScroll: true })
      return
    }
    setSearchOpen((o) => !o)
  }

  return (
    <header className="relative z-40 bg-white">
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
          {/* Four links fit beside the centred logo at 1024px only with the smaller gap */}
          <nav className="hidden items-center gap-6 text-base text-brown lg:flex xl:gap-9">
            {links.map((link) => (
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
            onClick={onSearchClick}
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

      {searchOpen && <HeaderSearch onClose={closeSearch} />}

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={links}
        categories={categories}
      />
    </header>
  )
}

