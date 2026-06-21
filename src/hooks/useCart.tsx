'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { CartItem } from '@/types/shop'

const STORAGE_KEY = 'olga-shop-cart'

interface CartContextValue {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * CartProvider хранит корзину в состоянии React и синхронизирует её с
 * localStorage, чтобы корзина переживала перезагрузку страницы.
 * Без онлайн-оплаты корзина целиком клиентская — на сервер уходит
 * только финальный заказ при checkout.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Загружаем корзину из localStorage один раз при монтировании.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // битый JSON — игнорируем, начинаем с пустой корзины
    }
    setHydrated(true)
  }, [])

  // Сохраняем при каждом изменении (но не до первой гидрации).
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Та же позиция = тот же товар + размер + цвет: увеличиваем кол-во.
      const idx = prev.findIndex(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          p.color === item.color,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
        return next
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value: CartContextValue = {
    items,
    totalCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart має використовуватись всередині <CartProvider>')
  }
  return ctx
}
