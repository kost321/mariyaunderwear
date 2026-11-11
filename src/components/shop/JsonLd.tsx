import { CONTACTS } from '@/lib/contacts'

/** Site origin without a trailing slash, for absolute URLs in structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * Structured data for Google (schema.org JSON-LD). "<" is escaped so text from the admin
 * cannot close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/** Breadcrumbs for search results: "Головна › Нічні сорочки › …". `url` is a site path. */
export function breadcrumbsLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * Home page: the store (name, logo, contacts, social profiles) and the site with its catalog search,
 * which Google can show as a search box under the result.
 */
export function storeLd() {
  const sameAs = [CONTACTS.instagram, CONTACTS.tiktok].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#store`,
        name: 'Mariya Underwear',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/brand/logo.jpg`,
        image: `${SITE_URL}/brand/og-image.png`,
        ...(CONTACTS.email && { email: CONTACTS.email }),
        ...(CONTACTS.phone && { telephone: CONTACTS.phone.replace(/[^\d+]/g, '') }),
        ...(CONTACTS.addressParts.street && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: CONTACTS.addressParts.street,
            addressLocality: CONTACTS.addressParts.city,
            addressRegion: CONTACTS.addressParts.region,
            ...(CONTACTS.postcode && { postalCode: CONTACTS.postcode }),
            addressCountry: 'UA',
          },
        }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Mariya Underwear',
        url: `${SITE_URL}/`,
        inLanguage: 'uk',
        publisher: { '@id': `${SITE_URL}/#store` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/catalog?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}
