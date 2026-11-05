import type { Metadata } from 'next'
import { CooperationForm } from '@/components/shop/CooperationForm'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Співпраця',
  description: 'PR, колаборації та B2B-співпраця з Mariya Underwear: дистрибуція, виставки, оптові продажі.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

const muted = 'text-[13px] leading-[17px] text-ink/50'

export default function Cooperation() {
  return (
    <div className="grid gap-12 py-6 lg:grid-cols-[468px_468px] lg:justify-between lg:px-[39px] lg:pb-[100px] lg:pt-[50px]">
      <section>
        <h1 className="font-serif text-xl uppercase leading-[26px] text-ink">Співпраця з Mariya Underwear</h1>

        <h2 className="mt-8 font-serif text-sm text-ink">PR</h2>
        <p className={`mt-4 ${muted}`}>
          З питань колаборацій, інтерв&apos;ю та партнерств
          {CONTACTS.email ? (
            <>
              :{' '}
              <a href={`mailto:${CONTACTS.email}`} className="underline underline-offset-2 hover:text-ink">
                {CONTACTS.email}
              </a>
            </>
          ) : (
            ' — заповніть форму звʼязку.'
          )}
        </p>

        <h2 className="mt-10 font-serif text-sm text-ink">B2B</h2>
        <div className={`mt-4 space-y-4 ${muted}`}>
          <p>
            Якщо вас цікавить співпраця з mariya underwear у форматі дистрибуції, виставок чи оптового продажу
            виробів, будемо раді познайомитися. Заповніть форму звʼязку або зв&apos;яжіться з нами напряму.
          </p>
          {(CONTACTS.email || CONTACTS.wholesalePhone) && (
            <p>
              {CONTACTS.email && (
                <>
                  Електронна адреса:{' '}
                  <a href={`mailto:${CONTACTS.email}`} className="underline underline-offset-2 hover:text-ink">
                    {CONTACTS.email}
                  </a>
                </>
              )}
              {CONTACTS.email && CONTACTS.wholesalePhone && <br />}
              {CONTACTS.wholesalePhone && (
                <>
                  Телефон:{' '}
                  <a href={`tel:${phoneHref(CONTACTS.wholesalePhone)}`} className="hover:text-ink">
                    {CONTACTS.wholesalePhone}
                  </a>
                  {CONTACTS.wholesaleContact && ` (${CONTACTS.wholesaleContact})`}
                </>
              )}
            </p>
          )}
          <p>Поділимося актуальним каталогом і розповімо про умови співпраці.</p>
        </div>
      </section>

      <CooperationForm />
    </div>
  )
}
