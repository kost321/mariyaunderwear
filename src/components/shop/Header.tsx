'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

/**
 * Шапка магазина с навигацией и счётчиком корзины.
 * Клиентский компонент, потому что читает состояние корзины.
 */
export function Header() {
  const { totalCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Mariya Underwear
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalog" className="hover:text-muted-foreground">
            Каталог

          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-1 hover:text-muted-foreground"
            aria-label="Кошик"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {totalCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}
