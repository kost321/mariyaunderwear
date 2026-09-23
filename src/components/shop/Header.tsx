'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'

/**
 * Шапка магазина с навигацией и счётчиком корзины.
 * Клиентский компонент, потому что читает состояние корзины.
 */
export function Header() {
  const t = useTranslations('Header')
  const { totalCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Mariya Underwear
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalog" className="hover:text-muted-foreground">
            {t('catalog')}
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-1 hover:text-muted-foreground"
            aria-label={t('cart')}
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {totalCount}
              </span>
            )}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
