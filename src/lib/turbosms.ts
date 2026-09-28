/**
 * TurboSMS — відправка SMS через HTTP API (https://turbosms.ua/api.html).
 *
 * Env:
 *  - TURBOSMS_TOKEN  — токен з кабінету TurboSMS (розділ «API»).
 *  - TURBOSMS_SENDER — зареєстроване в TurboSMS ім'я відправника (альфа-ім'я).
 *
 * Якщо змінні не задані — SMS не надсилається (лише попередження в лог),
 * щоб локальна розробка працювала без TurboSMS.
 */

const API_URL = 'https://api.turbosms.ua/message/send.json'

/**
 * Приводить український номер до формату 380XXXXXXXXX.
 * Телефон у формі — вільний текст, тож приймаємо «+38 (067) 123-45-67»,
 * «0671234567», «671234567» тощо. Повертає null, якщо номер не схожий на UA.
 */
export function normalizeUaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^380\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return `38${digits}`
  if (/^\d{9}$/.test(digits)) return `380${digits}`
  return null
}

export async function sendSms(phone: string, text: string): Promise<boolean> {
  const token = process.env.TURBOSMS_TOKEN
  const sender = process.env.TURBOSMS_SENDER
  if (!token || !sender) {
    console.warn('[turbosms] TURBOSMS_TOKEN / TURBOSMS_SENDER не задані — SMS не надіслано')
    return false
  }

  const recipient = normalizeUaPhone(phone)
  if (!recipient) {
    console.warn(`[turbosms] Некоректний номер «${phone}» — SMS не надіслано`)
    return false
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients: [recipient], sms: { sender, text } }),
      signal: AbortSignal.timeout(10_000),
    })
    const json = await res.json().catch(() => null)
    // Для кожного отримувача TurboSMS повертає response_code 0 (OK), якщо SMS прийнято.
    const code = json?.response_result?.[0]?.response_code
    if (!res.ok || code !== 0) {
      console.error('[turbosms] Помилка відправки:', res.status, JSON.stringify(json))
      return false
    }
    return true
  } catch (err) {
    console.error('[turbosms] Помилка запиту:', err)
    return false
  }
}
