/**
 * Which copy of the site is running. Production is the copy whose NEXT_PUBLIC_SERVER_URL is the shop's
 * domain; staging (mariyaunderwear-staging.up.railway.app) and local dev are not.
 * Outside production the site is closed to search engines (robots.ts, next.config.mjs) and the admin never
 * deletes files from Cloudinary, which is shared with production (lib/cloudinaryAdapter.ts).
 * next.config.mjs repeats this check, because it cannot import TypeScript.
 */
export const PRODUCTION_HOST = 'mariyaunderwear.com'

export function isProductionSite(): boolean {
  try {
    return new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? '').hostname === PRODUCTION_HOST
  } catch {
    return false
  }
}
