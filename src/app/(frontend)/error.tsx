'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { HomeLink, StatusScreen, primaryButton } from '@/components/shop/StatusScreen'
import { CONTACTS, phoneHref } from '@/lib/contacts'

const link = 'whitespace-nowrap text-ink underline underline-offset-4 hover:no-underline'

/**
 * Unexpected error while rendering a page, in the style of the 404: a large warm "500", the title in normal
 * case, and the shop's Instagram and phone (the visitor may be in the middle of an order). "Спробувати ще
 * раз" re-renders the segment; the checkout keeps what was typed in sessionStorage (CartPage), so it survives.
 * A server render error is answered with status 500 by Next itself.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <>
      {/* metadata cannot be exported from a client boundary; React puts this <title> into <head> */}
      <title>Щось пішло не так — Mariya Underwear</title>
      <StatusScreen
        title="500"
        subtitle="Щось пішло не так"
        text={
          <>
            <p>На сервері сталася помилка. Спробуйте оновити сторінку або поверніться трохи пізніше.</p>
            <p className="mt-3">
              Якщо помилка повторюється, напишіть нам в{' '}
              <a href={CONTACTS.instagram} target="_blank" rel="noopener noreferrer" className={link}>
                Instagram
              </a>{' '}
              або зателефонуйте:{' '}
              <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={link}>
                {CONTACTS.phone}
              </a>
            </p>
          </>
        }
      >
        <button type="button" onClick={reset} className={primaryButton}>
          Спробувати ще раз
        </button>
        <HomeLink />
      </StatusScreen>
    </>
  )
}
