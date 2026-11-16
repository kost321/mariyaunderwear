'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard focus for a modal window (quick order, size chart, photo viewer, burger menu): while `active`,
 * focus moves into the window (to an element marked data-autofocus, else the first control), Tab and
 * Shift+Tab cycle inside it instead of walking the page under the backdrop, and on closing the focus goes
 * back to the button that opened it. Attach the returned ref to the window's panel.
 */
export function useModalFocus<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const panel = ref.current
    if (!active || !panel) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const controls = () => [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)

    const first = panel.querySelector<HTMLElement>('[data-autofocus]') ?? controls()[0] ?? panel
    first.focus({ preventScroll: true })

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !panel) return
      const items = controls()
      if (!items.length) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const inside = panel.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === firstItem)) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === lastItem)) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // The opener may be gone (a menu link navigated away); then the focus stays where the page puts it
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [active])

  return ref
}
