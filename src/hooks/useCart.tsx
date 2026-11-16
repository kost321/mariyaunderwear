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

/** The order API refuses more than 99 of a line; lines saved before `maxQuantity` existed get this cap. */
const MAX_LINE_QUANTITY = 99

/** Most units of a line the cart allows: the stock snapshot, never more than the API accepts. */
export const lineMax = (item: Pick<CartItem, 'maxQuantity'>): number =>
  Math.min(item.maxQuantity ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY)

const clampQuantity = (item: CartItem, quantity: number): number =>
  Math.max(1, Math.min(lineMax(item), quantity))

interface CartContextValue {
  items: CartItem[]
  /** false until the cart is read from localStorage: an empty list then does not mean an empty cart */
  ready: boolean
  totalCount: number
  totalPrice: number
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  /** Puts a removed line back at its old place ("Повернути" in the cart toast) */
  restoreItem: (item: CartItem, index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  /** Replaces the stock snapshots with the current stock (productId → size → units) and trims the quantities */
  applyStock: (stock: Record<string, Record<string, number>>) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * CartProvider keeps the cart in React state and syncs it with
 * localStorage so the cart survives a page reload.
 * Without online payment the cart is entirely client-side; only the
 * final order is sent to the server at checkout.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load the cart from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // broken JSON: ignore it and start with an empty cart
    }
    setHydrated(true)
  }, [])

  // Save on every change (but not before the first hydration).
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Same line = same product + size + color: increase the quantity.
      const idx = prev.findIndex(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          p.color === item.color,
      )
      if (idx >= 0) {
        const next = [...prev]
        // The newer stock snapshot wins: the shop may have restocked or sold out since the first add.
        const merged = { ...next[idx], maxQuantity: item.maxQuantity ?? next[idx].maxQuantity }
        next[idx] = { ...merged, quantity: clampQuantity(merged, next[idx].quantity + item.quantity) }
        return next
      }
      return [...prev, { ...item, quantity: clampQuantity(item, item.quantity) }]
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const restoreItem = useCallback((item: CartItem, index: number) => {
    setItems((prev) => [...prev.slice(0, index), item, ...prev.slice(index)])
  }, [])

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: clampQuantity(item, quantity) } : item,
      ),
    )
  }, [])

  const applyStock = useCallback((stock: Record<string, Record<string, number>>) => {
    setItems((prev) =>
      prev.map((item) => {
        // A product or size the shop no longer has counts as 0: the line stays, marked as not available
        const maxQuantity = stock[item.productId]?.[item.size ?? ''] ?? 0
        const next = { ...item, maxQuantity }
        return { ...next, quantity: clampQuantity(next, item.quantity) }
      }),
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
    ready: hydrated,
    totalCount,
    totalPrice,
    addItem,
    removeItem,
    restoreItem,
    updateQuantity,
    applyStock,
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
