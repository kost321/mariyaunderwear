import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { CooperationForm } from '@/components/shop/CooperationForm'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { CONTACTS, phoneHref } from '@/lib/contacts'
import type { Locale } from '@/i18n/routing'
import { alternates } from '@/lib/seo'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Cooperation' })
  return { title: t('title'), description: t('description'), alternates: alternates(locale, '/cooperation') }
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

// Same text styles as the contacts page: sans subheadings a step bolder, body in the "Про бренд" colour
const subheading = 'text-base font-medium text-ink'
const text = 'text-base leading-7 text-brown'
// Links inside a sentence are underlined all the time: by colour alone they barely stand out (axe link-in-text-block)
const link = 'text-ink underline underline-offset-4 transition-colors hover:no-underline'

const wholesaleTel = `tel:${phoneHref(CONTACTS.wholesalePhone)}`

export default async function Cooperation({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Cooperation' })
  const store = await getTranslations({ locale, namespace: 'Store' })
  const home = (await getTranslations({ locale, namespace: 'Common' }))('home')

  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd(
          [
            { name: home, url: '/' },
            { name: t('title'), url: '/cooperation' },
          ],
          locale,
        )}
      />
      <Breadcrumbs items={[{ name: home, href: '/' }, { name: t('title') }]} />
      <h1 className="heading-page mt-2">{t('title')}</h1>

      <div className="mt-8 grid gap-12 lg:mt-14 lg:grid-cols-2 lg:gap-16">
        <section className="max-w-[560px]">
          <h2 className={subheading}>PR</h2>
          <p className={`mt-2 ${text}`}>
            {t('prText')}{' '}
            <a href={wholesaleTel} className={link}>
              {CONTACTS.wholesalePhone}
            </a>
            {CONTACTS.wholesaleContact && ` (${store('wholesaleContact')})`}
          </p>

          <h2 className={`mt-10 ${subheading}`}>B2B</h2>
          <div className={`mt-2 space-y-4 ${text}`}>
            <p>{t('b2bText')}</p>
            <p>
              {t('emailLabel')}{' '}
              <a href={`mailto:${CONTACTS.email}`} className={link}>
                {CONTACTS.email}
              </a>
              <br />
              {t('phoneLabel')}{' '}
              <a href={wholesaleTel} className={link}>
                {CONTACTS.wholesalePhone}
              </a>
            </p>
            <p>{t('catalogText')}</p>
          </div>
        </section>

        <CooperationForm />
      </div>
    </div>
  )
}
