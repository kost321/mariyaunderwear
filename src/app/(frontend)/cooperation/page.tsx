import type { Metadata } from 'next'
import { CooperationForm } from '@/components/shop/CooperationForm'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Співпраця',
  description: 'PR, колаборації та B2B-співпраця з Mariya Underwear: дистрибуція, виставки, оптові продажі.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

const heading = 'font-serif text-sm leading-[18px] text-brown'
const muted = 'text-xs leading-[1.3] text-ink/50'
const link = 'font-medium text-brown transition-colors hover:text-ink'

const wholesaleTel = `tel:${phoneHref(CONTACTS.wholesalePhone)}`

export default function Cooperation() {
  return (
    <div className="grid gap-12 py-6 lg:grid-cols-[468px_468px] lg:justify-between lg:px-[39px] lg:pb-[100px] lg:pt-[50px]">
      <section>
        <h1 className="font-serif text-xl uppercase leading-[26px] text-ink">Співпраця з Mariya Underwear</h1>

        <h2 className={`mt-6 ${heading}`}>PR</h2>
        <p className={`mt-4 ${muted} text-[13px]`}>
          З питань колаборацій, інтерв&apos;ю та партнерств:{' '}
          <a href={wholesaleTel} className={`${link} text-xs`}>
            {CONTACTS.wholesalePhone}
          </a>
          {CONTACTS.wholesaleContact && ` (${CONTACTS.wholesaleContact})`}
        </p>

        <h2 className={`mt-10 ${heading}`}>B2B</h2>
        <div className={`mt-4 space-y-4 ${muted}`}>
          <p>
            Якщо вас цікавить співпраця з mariya underwear у форматі дистрибуції, виставок чи оптового продажу
            виробів, будемо раді познайомитися.
            <br />
            Заповніть форму звʼязку або зв&apos;яжіться з нами напряму.
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
  )
}
