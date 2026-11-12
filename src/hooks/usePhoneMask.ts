'use client'

import { useLayoutEffect, useRef } from 'react'
import { formatUaPhoneInput, UA_PHONE_PREFIX } from '@/lib/phone'

/**
 * Phone mask "+380 (67) 123 45 67" for a controlled input (checkout and quick order). The value lives with
 * the caller; this hook formats every change and keeps the caret after the same digit it was after
 * (applied in a layout effect, once React has written the new value). Backspace over a bracket or a space
 * removes the digit before it, otherwise the mask would put the separator straight back.
 * Start the value at UA_PHONE_PREFIX: the country code is already typed in and cannot be erased.
 */
export function usePhoneMask(value: string, onValue: (next: string) => void) {
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (caret.current === null || document.activeElement !== ref.current) return
    ref.current?.setSelectionRange(caret.current, caret.current)
    caret.current = null
  }, [value])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value
    let at = e.target.selectionStart ?? raw.length
    if (formatUaPhoneInput(raw) === value && raw.length < value.length) {
      const digitAt = raw.slice(0, at).search(/\d\D*$/)
      if (digitAt > UA_PHONE_PREFIX.length - 2) {
        raw = raw.slice(0, digitAt) + raw.slice(digitAt + 1)
        at = digitAt
      }
    }
    const next = formatUaPhoneInput(raw)
    let pos = next.length
    if (at < raw.length) {
      const digitsBefore = raw.slice(0, at).replace(/\D/g, '').length
      pos = 0
      for (let seen = 0; pos < next.length && seen < digitsBefore; pos++) if (/\d/.test(next[pos])) seen++
      pos = Math.max(pos, UA_PHONE_PREFIX.length)
    }
    caret.current = pos
    onValue(next)
  }

  return { ref, onChange }
}
