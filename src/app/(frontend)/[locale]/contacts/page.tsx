import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { SocialLinks } from '@/components/shop/SocialLinks'
import { CONTACTS, phoneHref } from '@/lib/contacts'
import type { Locale } from '@/i18n/routing'
import { alternates } from '@/lib/seo'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  return { title: t('title'), description: t('description'), alternates: alternates(locale, '/contacts') }
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
 * Address, hours and the contact name are in the Store namespace of src/messages (translated).
 */
export default async function Contacts({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  const store = await getTranslations({ locale, namespace: 'Store' })
  const home = (await getTranslations({ locale, namespace: 'Common' }))('home')

  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd(
          [
            { name: home, url: '/' },
            { name: t('title'), url: '/contacts' },
          ],
          locale,
        )}
      />
      <Breadcrumbs items={[{ name: home, href: '/' }, { name: t('title') }]} />
      <h1 className="heading-page mt-2">{t('title')}</h1>

      <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 sm:gap-y-10 lg:mt-14 lg:grid-cols-3">
        {CONTACTS.phone && (
          <Section title={t('customerCare')}>
            <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={link}>
              {CONTACTS.phone}
            </a>
          </Section>
        )}

        {CONTACTS.wholesalePhone && (
          <Section title={t('wholesale')}>
            <a href={`tel:${phoneHref(CONTACTS.wholesalePhone)}`} className={link}>
              {CONTACTS.wholesalePhone}
            </a>
            {CONTACTS.wholesaleContact && <span>, {store('wholesaleContact')}</span>}
          </Section>
        )}

        {CONTACTS.email && (
          <Section title={t('email')}>
            <a href={`mailto:${CONTACTS.email}`} className={link}>
              {CONTACTS.email}
            </a>
          </Section>
        )}

        {CONTACTS.workHours.length > 0 && (
          <Section title={t('hours')}>
            <p>{store('workHours')}</p>
            <p>{store('weekend')}</p>
          </Section>
        )}

        {CONTACTS.address && (
          <Section title={t('address')}>
            <p>{store('address')}</p>
          </Section>
        )}

        {(CONTACTS.instagram || CONTACTS.tiktok) && (
          <Section title={t('social')}>
            <SocialLinks items={['instagram', 'tiktok']} size={24} gap={8} className="-mt-1" />
          </Section>
        )}
      </div>
    </div>
  )
}
