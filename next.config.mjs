import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

// Підключає src/i18n/request.ts (мова + словник для кожного запиту).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
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
export default withPayload(withNextIntl(nextConfig))
