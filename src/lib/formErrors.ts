/**
 * Field messages shared by the site's forms (checkout, quick order, cooperation). The forms check their
 * fields themselves (noValidate): every message shows at once under its field, in the same words in every
 * browser, instead of the browser's own one-at-a-time bubble in the browser's language.
 */
export const FIELD_ERRORS = {
  firstName: 'Вкажіть імʼя',
  lastName: 'Вкажіть прізвище',
  emailRequired: 'Вкажіть електронну пошту',
  email: 'Перевірте адресу пошти, наприклад name@example.com',
  city: 'Вкажіть місто',
  novaPoshtaBranch: 'Вкажіть номер відділення або поштомата',
  paymentMethod: 'Оберіть спосіб оплати',
} as const

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** Puts the cursor in the first field marked invalid inside `root`, once React has drawn the messages. */
export function focusFirstInvalid(root: HTMLElement | null) {
  requestAnimationFrame(() => root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
}
