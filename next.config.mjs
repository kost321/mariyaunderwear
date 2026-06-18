import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Здесь можно настраивать разрешённые домены для next/image,
  // редиректы, заголовки и т.д.
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
export default withPayload(nextConfig)
