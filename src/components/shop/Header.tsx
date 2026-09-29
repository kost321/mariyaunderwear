'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { MobileMenu, type MenuCategory } from './MobileMenu'

export const NAV_LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/catalog?sort=new', label: 'Новинки' },
]

/**
 * Шапка магазина: навигация слева (на мобилке — бургер), логотип по центру, корзина справа.
 * Клиентский компонент, потому что читает состояние корзины и открывает меню.
 */
export function Header({ categories }: { categories: MenuCategory[] }) {
  const { totalCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

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
          <nav className="hidden items-center gap-9 text-base tracking-[2px] text-brown lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-opacity hover:opacity-70">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label="Mariya Underwear — на головну" className="justify-self-center">
          <Image
            src="/brand/logo.jpg"
            alt="Mariya underwear"
            width={164}
            height={53}
            priority
            className="h-[34px] w-auto mix-blend-darken lg:h-[53px]"
          />
        </Link>

        <Link
          href="/cart"
          aria-label={totalCount > 0 ? `Кошик, товарів: ${totalCount}` : 'Кошик'}
          className="group flex items-center justify-self-end"
        >
          <span className="hidden h-[50px] items-center rounded-[22px] bg-ink pl-5 pr-7 text-xs font-medium tracking-[2px] text-white lg:flex">
            Кошик
          </span>
          <span className="relative lg:-ml-3">
            <Image
              src="/brand/bag.svg"
              alt=""
              width={50}
              height={50}
              className="h-10 w-10 lg:h-[50px] lg:w-[50px]"
            />
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 text-[11px] font-medium text-ink">
                {totalCount}
              </span>
            )}
          </span>
        </Link>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV_LINKS}
        categories={categories}
      />
    </header>
  )
}
