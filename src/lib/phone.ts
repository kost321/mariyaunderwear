/**
 * Ukrainian phone numbers: the order API accepts the usual ways of writing one
 * (+380 67 123 45 67, 380671234567, 067-123-45-67, 671234567) and stores a single
 * format, +380XXXXXXXXX: easy for the manager to read and ready for SMS (TurboSMS
 * wants the digits without the plus).
 * Returns null for anything that is not a Ukrainian number.
 */
export function normalizeUaPhone(input: string): string | null {
  if (!/^[\d\s+()-]+$/.test(input)) return null
  const digits = input.replace(/\D/g, '')
  const national =
    digits.length === 12 && digits.startsWith('380')
      ? digits.slice(3)
      : digits.length === 10 && digits.startsWith('0')
        ? digits.slice(1)
        : digits.length === 9
          ? digits
          : null
  // After the country code: a 2-digit operator/area code that does not start with 0.
  if (!national || national.startsWith('0')) return null
  return `+380${national}`
}
