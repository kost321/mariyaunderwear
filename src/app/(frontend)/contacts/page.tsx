import type { Metadata } from 'next'
import { SocialLinks } from '@/components/shop/SocialLinks'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Контакти',
  description: 'Телефон, пошта, соцмережі та адреса Mariya Underwear.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

const heading = 'font-serif text-sm uppercase leading-[18px] text-brown'
const value = 'text-[13px] font-medium leading-[1.3] text-brown'
const muted = 'text-xs leading-[1.3] text-ink/50'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className={heading}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line) => (
        <p key={line} className={muted}>
          {line}
        </p>
      ))}
    </>
  )
}

export default function Contacts() {
  return (
    <div className="py-6 lg:px-[35px] lg:pb-[100px] lg:pt-[50px]">
      <h1 className="font-serif text-xl uppercase leading-[26px] text-ink">Контакти</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[594px_468px] lg:gap-x-0">
        <div className="flex flex-col gap-6">
          {CONTACTS.workHours.length > 0 && (
            <Section title="Графік роботи">
              <Lines lines={CONTACTS.workHours} />
            </Section>
          )}

          {CONTACTS.phone && (
            <Section title="Клієнтська турбота">
              <p className={value}>
                <a href={`tel:${phoneHref(CONTACTS.phone)}`} className="hover:text-ink">
                  {CONTACTS.phone}
                </a>
              </p>
              <p className={muted}>прийом дзвінків</p>
              <Lines lines={CONTACTS.workHours} />
            </Section>
          )}

          {(CONTACTS.instagram || CONTACTS.tiktok) && (
            <Section title="Соцмережі">
              <SocialLinks items={['instagram', 'tiktok']} size={26} gap={8} />
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {CONTACTS.address && (
            <Section title="Адреса магазину">
              <p className={value}>{CONTACTS.postcode}</p>
              <p className={muted}>{CONTACTS.address}</p>
            </Section>
          )}

          {CONTACTS.wholesaleAddress && (
            <Section title="Відділ оптових закупівель">
              <p className={muted}>{CONTACTS.wholesaleAddress}</p>
            </Section>
          )}

          {CONTACTS.email && (
            <Section title="Пошта">
              <p className={muted}>
                <a href={`mailto:${CONTACTS.email}`} className="hover:text-ink">
                  {CONTACTS.email}
                </a>
              </p>
            </Section>
          )}

          {CONTACTS.wholesalePhone && (
            <Section title="Питання щодо гуртової співпраці">
              <p className="text-xs leading-[1.3]">
                <a href={`tel:${phoneHref(CONTACTS.wholesalePhone)}`} className="font-medium text-brown hover:text-ink">
                  {CONTACTS.wholesalePhone}
                </a>
                {CONTACTS.wholesaleContact && <span className="text-ink/50"> ({CONTACTS.wholesaleContact})</span>}
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
