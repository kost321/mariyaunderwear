import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allowed next/image domains, redirects, headers, etc. are configured here.
  images: {
    // 1600 matches the Cloudinary originals; 85 is the quality for photos (default is 75).
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    qualities: [75, 85],
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
export default withPayload(nextConfig)
