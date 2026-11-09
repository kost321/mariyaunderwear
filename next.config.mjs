import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allowed next/image domains, redirects, headers, etc. are configured here.
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
export default withSentryConfig(withPayload(nextConfig), {
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
