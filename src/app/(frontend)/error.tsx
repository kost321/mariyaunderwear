'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { HomeLink, StatusScreen, primaryButton } from '@/components/shop/StatusScreen'

/** Unexpected error while rendering a page: "try again" re-renders the segment. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <StatusScreen
      title="error"
      text={
        <>
          <p>На сервері виникла несподівана помилка.</p>
          <p>Спробуйте оновити сторінку або повернутися трохи пізніше.</p>
        </>
      }
    >
      <button type="button" onClick={reset} className={primaryButton}>
        Спробувати ще раз
      </button>
      <HomeLink />
    </StatusScreen>
  )
}
