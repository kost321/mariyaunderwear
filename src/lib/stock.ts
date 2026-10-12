/**
 * Stock rules shared by the product page, the catalog filter and the order API.
 * A size is orderable only when a positive stock is entered: an empty field counts
 * as "not in stock" (the size is crossed out), so nothing sells without a known stock.
 */
type SizeStock = { stock?: number | null }

export const isSizeAvailable = (size: SizeStock): boolean =>
  typeof size.stock === 'number' && size.stock > 0

/** At least one size is available; a product without sizes has nothing entered, so it is not in stock. */
export const isProductInStock = (sizes: SizeStock[] | null | undefined): boolean =>
  (sizes ?? []).some(isSizeAvailable)
