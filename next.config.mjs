import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

// Підключає src/i18n/request.ts (мова + словник для кожного запиту).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Здесь можно настраивать разрешённые домены для next/image,
  // редиректы, заголовки и т.д.
  // Українська живе на /ua (код мови uk). Якщо хтось набере /uk/… за
  // звичкою — ведемо на /ua/…
  async redirects() {
    return [
      { source: '/uk', destination: '/ua', permanent: true },
      { source: '/uk/:path*', destination: '/ua/:path*', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

// withPayload оборачивает конфиг Next, чтобы корректно собрать
// серверную часть Payload внутри Next.js (admin UI, API, бандлинг).
export default withPayload(withNextIntl(nextConfig))
