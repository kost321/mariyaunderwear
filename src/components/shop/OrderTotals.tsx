import { formatPrice } from '@/lib/utils'

/**
 * "Сума / Доставка / Разом" under an order: amounts in the body font, the total larger and bolder.
 * Shared by the cart summary, the checkout panel and the "order accepted" page.
 */
export function OrderTotals({ total }: { total: number }) {
  return (
    <>
      <dl className="space-y-2 text-sm text-brown">
        <div className="flex justify-between gap-4">
          <dt>Сума</dt>
          <dd className="tabular-nums text-ink">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Доставка</dt>
          <dd className="text-right">за тарифами Нової пошти</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-brown/15 pt-4 text-ink">
        <span className="text-base font-medium">Разом</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(total)}</span>
      </div>
    </>
  )
}
