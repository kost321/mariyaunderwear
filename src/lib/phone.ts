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
  // With a plus it is an international number: exactly +380 and 9 digits. Otherwise a short "+380 67 123 4"
  // passed as 9 bare digits and became +380380671234.
  if (input.trim().startsWith('+') && !(digits.length === 12 && digits.startsWith('380'))) return null
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

/** Shown by the order API and by the forms before sending, so the wording is the same everywhere. */
export const PHONE_ERROR = 'Вкажіть український номер телефону, наприклад +380 67 123 45 67'

/** What the checkout phone field starts with: the country code is already typed in. */
export const UA_PHONE_PREFIX = '+380 '

/**
 * Input mask for a Ukrainian number: whatever is typed or pasted becomes "+380 (67) 123 45 67" as far as
 * it goes. The +380 cannot be erased; a leading 0 ("067…", the way numbers are usually written) and a
 * pasted country code are dropped. The closing bracket appears only with the third digit, otherwise
 * Backspace right after "(67)" would delete the bracket and the mask would put it straight back.
 */
export function formatUaPhoneInput(raw: string): string {
  let national = raw.replace(/\D/g, '')
  if (national.startsWith('380')) national = national.slice(3)
  if (national.length > 9 && national.startsWith('380')) national = national.slice(3)
  national = national.replace(/^0+/, '').slice(0, 9)
  if (!national) return UA_PHONE_PREFIX
  let out = `+380 (${national.slice(0, 2)}`
  if (national.length > 2) out += `) ${national.slice(2, 5)}`
  if (national.length > 5) out += ` ${national.slice(5, 7)}`
  if (national.length > 7) out += ` ${national.slice(7, 9)}`
  return out
}

/** Digits typed after +380 in the masked field (0 when only the prefix is there). */
export const uaPhoneDigits = (value: string) => Math.max(0, value.replace(/\D/g, '').length - 3)
