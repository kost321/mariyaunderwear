import type { Metadata } from 'next'
import { CartPage } from '@/components/shop/CartPage'

export const metadata: Metadata = {
  title: 'Кошик',
}

// Not prerendered at build time: the layout pulls menu categories from the DB, and on Railway
// it is unavailable during the build, so the menu would stay empty
export const dynamic = 'force-dynamic'

export default function Cart() {
  return <CartPage />
}
