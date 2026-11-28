import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'

/**
 * "Сума / Доставка / Разом" under an order: amounts in the body font, the total larger and bolder.
 * Shared by the cart summary, the checkout panel and the "order accepted" page.
 */
export function OrderTotals({ total }: { total: number }) {
  const t = useTranslations('Totals')
  const currency = useTranslations('Common')('currency')
  return (
    <>
      <dl className="space-y-2 text-sm text-brown">
        <div className="flex justify-between gap-4">
          <dt>{t('subtotal')}</dt>
          <dd className="tabular-nums text-ink">{formatPrice(total, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t('delivery')}</dt>
          <dd className="text-right">{t('deliveryCost')}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-brown/15 pt-4 text-ink">
        <span className="text-base font-medium">{t('total')}</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(total, currency)}</span>
      </div>
    </>
  )
}
