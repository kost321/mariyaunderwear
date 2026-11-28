import * as Sentry from '@sentry/nextjs'
import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Sentry: error reports from the server and the browser.
 *
 * Reports must never carry customer data, so everything that can hold it (request body,
 * headers, cookies, query string, user, console output) is removed in `scrubEvent`.
 * Without NEXT_PUBLIC_SENTRY_DSN, or outside production, nothing is sent.
 */

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const PHONE = /\+?\d[\d\s()-]{7,}\d/g

function scrubText(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[phone]')
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user
  delete event.extra

  if (event.request) {
    event.request = { method: event.request.method, url: event.request.url?.split('?')[0] }
  }
  if (event.message) event.message = scrubText(event.message)
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value)
  }

  event.breadcrumbs = event.breadcrumbs
    ?.filter((crumb) => crumb.category !== 'console')
    .map((crumb) => ({
      ...crumb,
      message: crumb.message && scrubText(crumb.message),
      data: undefined,
    }))

  return event
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export const sentryOptions = {
  dsn,
  enabled: process.env.NODE_ENV === 'production' && Boolean(dsn),
  sendDefaultPii: false,
  beforeSend: scrubEvent,
}

/**
 * Reports a failure the code handles itself (the customer still sees success), which would
 * otherwise stay in the log only. `area` becomes a tag to filter by in Sentry.
 */
export function reportFailure(area: string, failure: unknown): void {
  const message =
    typeof failure === 'object' && failure !== null && 'message' in failure
      ? String(failure.message)
      : String(failure)
  Sentry.captureException(failure instanceof Error ? failure : new Error(`${area}: ${message}`), {
    tags: { area },
  })
}
