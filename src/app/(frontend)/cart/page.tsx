import type { Metadata } from 'next'
import { CartPage } from '@/components/shop/CartPage'

export const metadata: Metadata = {
  title: 'Кошик',
}

export default function Cart() {
  return (
    <div className="container py-8">
      <CartPage />
    </div>
  )
}
