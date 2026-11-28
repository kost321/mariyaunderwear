import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'
import createNextIntlPlugin from 'next-intl/plugin'

// Підключає src/i18n/request.ts (мова + словник для кожного запиту).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Same check as src/lib/siteEnv.ts: only the copy on the shop's domain may be indexed.
const isProductionSite = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? '').hostname === 'mariyaunderwear.com'
  } catch {
    return false
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Staging and local dev: every response says noindex, in case a link to them is found despite robots.txt.
  async headers() {
    if (isProductionSite) return []
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
  },
  // Allowed next/image domains, redirects, headers, etc. are configured here.
  // Ukrainian lives at /ua (language code uk). If someone types /uk/… out of
  // habit, send them to /ua/…
  async redirects() {
    return [
      { source: '/uk', destination: '/ua', permanent: true },
      { source: '/uk/:path*', destination: '/ua/:path*', permanent: true },
    ]
  },
  images: {
    // 1600 matches the Cloudinary originals; 90 is the photo quality (default is 75), 85 is for thumbnails.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

// withPayload wraps the Next config so the Payload server part
// (admin UI, API, bundling) builds correctly inside Next.js.
export default withSentryConfig(withPayload(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  // Source maps are produced only when they can be uploaded, and are never served to visitors.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
})
