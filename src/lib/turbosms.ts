/**
 * TurboSMS: SMS to customers through the HTTP API (https://turbosms.ua/api.html).
 *
 * Env:
 *  - TURBOSMS_TOKEN: token from the TurboSMS dashboard (Шлюз (API) → Настройки API).
 *  - TURBOSMS_SENDER: alpha name registered in TurboSMS. While operators are still
 *    registering it, TurboSMS substitutes its shared sender on its own.
 *
 * If either is unset, nothing is sent (only a warning in the log), so local
 * development works without TurboSMS.
 *
 * Texts: keep them within 70 Cyrillic characters, otherwise one message is billed as two.
 */
import { normalizeUaPhone } from '@/lib/phone'
import { reportFailure } from '@/lib/sentry'

const API_URL = 'https://api.turbosms.ua/message/send.json'

/**
 * Sends one SMS. Never throws: a failure is only logged and returns false,
 * because the order is already saved and the customer must not see an error.
 */
export async function sendSms(phone: string, text: string): Promise<boolean> {
  const token = process.env.TURBOSMS_TOKEN
  const sender = process.env.TURBOSMS_SENDER
  if (!token || !sender) {
    console.warn('[turbosms] TURBOSMS_TOKEN / TURBOSMS_SENDER не задані — SMS не надіслано')
    return false
  }

  // TurboSMS wants 380XXXXXXXXX, without the plus.
  const recipient = normalizeUaPhone(phone)?.slice(1)
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
    // Per recipient TurboSMS returns response_code 0 ("OK") and a message_id once the SMS is accepted.
    const result = json?.response_result?.[0]
    if (!res.ok || result?.response_code !== 0) {
      console.error('[turbosms] Помилка відправки:', res.status, JSON.stringify(json))
      reportFailure('sms', `HTTP ${res.status}, response_code ${result?.response_code}`)
      return false
    }
    console.info('[turbosms] SMS прийнято:', recipient, result.message_id)
    return true
  } catch (err) {
    console.error('[turbosms] Помилка запиту:', err)
    reportFailure('sms', err)
    return false
  }
}

/** SMS texts. Each stays within 70 characters for a 3-5 digit order number and a 14-digit TTN. */
export const smsText = {
  orderAccepted: (orderId: string | number) =>
    `Замовлення №${orderId} прийнято. Менеджер зателефонує найближчим часом.`,
  orderShipped: (orderId: string | number, ttn: string) =>
    `Замовлення №${orderId} відправлено. ТТН ${ttn}. Mariya Underwear`,
}
