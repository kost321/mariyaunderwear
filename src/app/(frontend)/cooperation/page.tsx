import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { CooperationForm } from '@/components/shop/CooperationForm'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Співпраця',
  description: 'PR, колаборації та B2B-співпраця з Mariya Underwear: дистрибуція, виставки, оптові продажі.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

// Same text styles as the contacts page: sans subheadings a step bolder, body in the "Про бренд" colour
const subheading = 'text-base font-medium text-ink'
const text = 'text-base leading-7 text-brown'
const link = 'text-ink underline-offset-4 transition-colors hover:underline'

const wholesaleTel = `tel:${phoneHref(CONTACTS.wholesalePhone)}`

export default function Cooperation() {
  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd([
          { name: 'Головна', url: '/' },
          { name: 'Співпраця', url: '/cooperation' },
        ])}
      />
      <Breadcrumbs items={[{ name: 'Головна', href: '/' }, { name: 'Співпраця' }]} />
      <h1 className="heading-page mt-2">Співпраця</h1>

      <div className="mt-8 grid gap-12 lg:mt-14 lg:grid-cols-2 lg:gap-16">
        <section className="max-w-[560px]">
          <h2 className={subheading}>PR</h2>
          <p className={`mt-2 ${text}`}>
            З питань колаборацій, інтерв&apos;ю та партнерств:{' '}
            <a href={wholesaleTel} className={link}>
              {CONTACTS.wholesalePhone}
            </a>
            {CONTACTS.wholesaleContact && ` (${CONTACTS.wholesaleContact})`}
          </p>

          <h2 className={`mt-10 ${subheading}`}>B2B</h2>
          <div className={`mt-2 space-y-4 ${text}`}>
            <p>
              Якщо вас цікавить співпраця з Mariya Underwear у форматі дистрибуції, виставок чи оптового продажу
              виробів, будемо раді познайомитися. Заповніть форму звʼязку або зв&apos;яжіться з нами напряму.
            </p>
            <p>
              Електронна адреса:{' '}
              <a href={`mailto:${CONTACTS.email}`} className={link}>
                {CONTACTS.email}
              </a>
              <br />
              Телефон:{' '}
              <a href={wholesaleTel} className={link}>
                {CONTACTS.wholesalePhone}
              </a>
            </p>
            <p>Поділимося актуальним каталогом і розповімо про умови співпраці.</p>
          </div>
        </section>

        <CooperationForm />
      </div>
    </div>
  )
}
