/**
 * UI-типы магазина, не зависящие от схемы Payload.
 * Типы товаров/категорий берём из сгенерированного payload-types.ts.
 */

/** Позиция в корзине (хранится в localStorage на клиенте). */
export interface CartItem {
  /** id товара в Payload */
  productId: string
  /** Снимок названия и цены на момент добавления */
  title: string
  price: number
  /** URL первого изображения для превью в корзине */
  image?: string
  slug: string
  /** Выбранные покупателем варианты */
  size?: string
  color?: string
  quantity: number
}

/** Данные, которые покупатель вводит при оформлении заказа. */
export interface CheckoutForm {
  customerName: string
  phone: string
  city: string
  novaPoshtaBranch: string
  email?: string
  comment?: string
}
