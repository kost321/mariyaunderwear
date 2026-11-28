'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('ErrorPage')
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <>
      {/* metadata cannot be exported from a client boundary; React puts this <title> into <head> */}
      <title>{`${t('title')} — Mariya Underwear`}</title>
      <StatusScreen
        title="500"
        subtitle={t('title')}
        text={
          <>
            <p>{t('text')}</p>
            <p className="mt-3">
              {t.rich('contact', {
                instagram: (chunks) => (
                  <a href={CONTACTS.instagram} target="_blank" rel="noopener noreferrer" className={link}>
                    {chunks}
                  </a>
                ),
                phone: () => (
                  <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={link}>
                    {CONTACTS.phone}
                  </a>
                ),
              })}
            </p>
          </>
        }
      >
        <button type="button" onClick={reset} className={primaryButton}>
          {t('retry')}
        </button>
        <HomeLink />
      </StatusScreen>
    </>
  )
}
