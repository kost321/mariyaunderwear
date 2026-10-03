/**
 * UI types for the store, independent of the Payload schema.
 * Product/category types come from the generated payload-types.ts.
 */

/** Cart line (stored in localStorage on the client). */
export interface CartItem {
  /** id of the product in Payload */
  productId: string
  /** Snapshot of title and price at the time of adding */
  title: string
  price: number
  /** URL of the first image for the cart preview */
  image?: string
  slug: string
  /** Variants selected by the customer */
  size?: string
  color?: string
  quantity: number
}

/** Data the customer enters at checkout. */
export interface CheckoutForm {
  customerName: string
  phone: string
  city: string
  novaPoshtaBranch: string
  email?: string
  comment?: string
}
