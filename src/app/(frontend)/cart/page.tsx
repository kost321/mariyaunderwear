import type { Metadata } from 'next'
import { CartPage } from '@/components/shop/CartPage'

export const metadata: Metadata = {
  title: 'Кошик',
}

// Не пререндеримо на білді: layout тягне категорії меню з БД, а на Railway
// під час білду вона недоступна — меню залишилось би порожнім
export const dynamic = 'force-dynamic'

export default function Cart() {
  return <CartPage />
}
