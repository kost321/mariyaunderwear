/**
 * Recipients of notification emails (orders, cooperation requests): ORDER_NOTIFY_EMAIL
 * (one address or several separated by commas). If the variable is unset, the owner's fallback address.
 */
export function notifyRecipients(): string[] {
  const list = (process.env.ORDER_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
  return list.length > 0 ? list : ['itsmariainthecity@gmail.com']
}

/** Escapes customer-supplied text before inserting it into the email HTML. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** A string with a length limit; undefined if the value is invalid. */
export function str(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > max) return undefined
  return value.trim()
}
