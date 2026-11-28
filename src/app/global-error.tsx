'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/** Last resort: the root layout itself failed, so site styles and components are unavailable. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="uk">
      <body style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20 }}>Сталася несподівана помилка</h1>
        <p>Спробуйте оновити сторінку трохи пізніше.</p>
      </body>
    </html>
  )
}
