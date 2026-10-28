/**
 * Payment methods the customer picks at checkout. There is no online payment, and the
 * choice is only information for the manager: the final method is agreed on the phone,
 * and the manager sends the FOP details for prepayment personally.
 * Shared by the checkout, the order API (validation, emails) and the Orders collection.
 */
export const PAYMENT_METHODS = [
  {
    value: 'prepaid',
    label: 'Передоплата на рахунок ФОП',
    hint: 'Реквізити надішле менеджер, коли підтвердить наявність',
  },
  {
    value: 'cod',
    label: 'Оплата при отриманні',
    hint: 'Накладений платіж у відділенні Нової пошти',
  },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHODS.some((m) => m.value === value)

export const paymentMethodLabel = (value: PaymentMethod): string =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value
