'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from '@/hooks/useCart'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'
import { MobileMenu, type MenuCategory } from './MobileMenu'

/** Navigation links; `key` is the label key in the Header dictionary. */
export const NAV_LINKS = [
  { href: '/', key: 'home' },
  { href: '/catalog', key: 'catalog' },
  { href: '/catalog?sort=new', key: 'newArrivals' },
] as const

/**
 * Store header: navigation on the left (burger on mobile), logo in the center, cart on the right.
 * Client component because it reads the cart state and opens the menu.
 */
export function Header({ categories }: { categories: MenuCategory[] }) {
  const t = useTranslations('Header')
  const { totalCount } = useCart()
  const links = NAV_LINKS.map((link) => ({
    href: link.href,
    label: t(link.key),
  }))
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white">
      <div className="container grid h-[88px] grid-cols-[1fr_auto_1fr] items-center lg:h-[144px]">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-m-2 p-2 lg:hidden"
            aria-label={t('openMenu')}
          >
            <Image src="/brand/burger.svg" alt="" width={28} height={18} />
          </button>
          <nav className="hidden items-center gap-9 text-base tracking-[2px] text-brown lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition-opacity hover:opacity-70">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label={t('toHome')} className="justify-self-center">
          <Image
            src="/brand/logo.jpg"
            alt="Mariya underwear"
            width={164}
            height={53}
            priority
            className="h-[34px] w-[105px] mix-blend-darken lg:h-[53px] lg:w-[164px]"
          />
        </Link>

        <div className="flex items-center gap-4 justify-self-end lg:gap-8">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <Link
            href="/cart"
            aria-label={totalCount > 0 ? t('cartCount', { count: totalCount }) : t('cart')}
            className="relative"
          >
            <Image src="/brand/bag.svg" alt="" width={50} height={50} className="h-10 w-10 lg:h-[50px] lg:w-[50px]" />
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 text-[11px] font-medium text-ink">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links} categories={categories} />
    </header>
  )
}
