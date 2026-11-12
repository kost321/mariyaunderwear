import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { SocialLinks } from '@/components/shop/SocialLinks'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Контакти',
  description: 'Телефон, пошта, соцмережі та адреса Mariya Underwear.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

// Body text in the colour of the "Про бренд" description; links a shade darker and underlined on hover
const text = 'text-base leading-7 text-brown'
const link = 'text-ink underline-offset-4 transition-colors hover:underline'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      {/* Subheadings in the sans, normal case, a step bolder than the text */}
      <h2 className="text-base font-medium text-ink">{title}</h2>
      <div className={`mt-2 ${text}`}>{children}</div>
    </section>
  )
}

/**
 * Contacts. The shop and the wholesale department share one address and one schedule, so each is
 * shown once. The address is a warehouse with no shop to visit, so it is just «Адреса», without a map.
 */
export default function Contacts() {
  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd([
          { name: 'Головна', url: '/' },
          { name: 'Контакти', url: '/contacts' },
        ])}
      />
      <Breadcrumbs items={[{ name: 'Головна', href: '/' }, { name: 'Контакти' }]} />
      <h1 className="heading-page mt-2">Контакти</h1>

      <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 sm:gap-y-10 lg:mt-14 lg:grid-cols-3">
        {CONTACTS.phone && (
          <Section title="Клієнтська турбота">
            <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={link}>
              {CONTACTS.phone}
            </a>
          </Section>
        )}

        {CONTACTS.wholesalePhone && (
          <Section title="Гуртова співпраця">
            <a href={`tel:${phoneHref(CONTACTS.wholesalePhone)}`} className={link}>
              {CONTACTS.wholesalePhone}
            </a>
            {CONTACTS.wholesaleContact && <span>, {CONTACTS.wholesaleContact}</span>}
          </Section>
        )}

        {CONTACTS.email && (
          <Section title="Пошта">
            <a href={`mailto:${CONTACTS.email}`} className={link}>
              {CONTACTS.email}
            </a>
          </Section>
        )}

        {CONTACTS.workHours.length > 0 && (
          <Section title="Графік роботи">
            {CONTACTS.workHours.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Section>
        )}

        {CONTACTS.address && (
          <Section title="Адреса">
            <p>{CONTACTS.address}</p>
          </Section>
        )}

        {(CONTACTS.instagram || CONTACTS.tiktok) && (
          <Section title="Соцмережі">
            <SocialLinks items={['instagram', 'tiktok']} size={24} gap={8} className="-mt-1" />
          </Section>
        )}
      </div>
    </div>
  )
}
