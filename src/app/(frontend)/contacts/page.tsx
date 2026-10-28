import type { Metadata } from 'next'
import { CONTACTS, phoneHref } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Контакти',
  description: 'Телефон, месенджери, пошта та адреса Mariya Underwear.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

const heading = 'font-serif text-sm uppercase leading-[18px] text-brown'
const value = 'text-xs font-medium leading-[16px] text-ink'
const muted = 'text-xs leading-[16px] text-ink/50'

const icon = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

// Handset glyph placed inside the messenger bubbles
const handset = (
  <g transform="translate(7.6 7.4) scale(0.37)" strokeWidth={4}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </g>
)

const ICONS = {
  telegram: (
    <svg {...icon}>
      <path d="M21.5 3.5 2.8 10.7c-.9.4-.9 1.1 0 1.4l4.7 1.5 1.8 5.6c.2.7.6.8 1.1.3l2.6-2.4 4.9 3.6c.9.5 1.5.2 1.7-.8L22.8 4.9c.3-1.3-.4-1.8-1.3-1.4z" />
      <path d="m7.5 13.6 10-6.3-7.4 7.1" />
    </svg>
  ),
  viber: (
    <svg {...icon}>
      <path d="M12 2.5c-5 0-8.5 1.3-8.5 7.5 0 3.6 1.1 5.6 3.5 6.6V21l3.3-3.3h1.7c5 0 8.5-1.4 8.5-7.7S17 2.5 12 2.5z" />
      {handset}
    </svg>
  ),
  whatsapp: (
    <svg {...icon}>
      <path d="M3 21l1.6-4.6A9 9 0 1 1 8 19.7L3 21z" />
      {handset}
    </svg>
  ),
  instagram: (
    <svg {...icon}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r=".6" fill="currentColor" />
    </svg>
  ),
  tiktok: (
    <svg {...icon}>
      <path d="M13 3h3c.3 2.4 1.9 4.1 4.5 4.4v3c-1.7 0-3.2-.5-4.5-1.4V15a6 6 0 1 1-6-6v3.1A2.9 2.9 0 1 0 13 15V3z" />
    </svg>
  ),
}

type IconLink = { label: string; href: string; icon: React.ReactNode }

const phone = phoneHref(CONTACTS.phone)

// Messengers are linked by the customer-care number
const MESSENGERS: IconLink[] = phone
  ? [
      { label: 'Telegram', href: `https://t.me/${phone}`, icon: ICONS.telegram },
      { label: 'Viber', href: `viber://chat?number=${encodeURIComponent(phone)}`, icon: ICONS.viber },
      { label: 'WhatsApp', href: `https://wa.me/${phone.replace('+', '')}`, icon: ICONS.whatsapp },
    ]
  : []

// Shown once the links are filled in lib/contacts
const SOCIALS: IconLink[] = [
  { label: 'Instagram', href: CONTACTS.instagram, icon: ICONS.instagram },
  { label: 'TikTok', href: CONTACTS.tiktok, icon: ICONS.tiktok },
].filter((link) => link.href)

function IconLinks({ items }: { items: IconLink[] }) {
  return (
    <ul className="mt-6 flex gap-2 lg:-ml-2">
      {items.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            className="flex size-[66px] items-center justify-center rounded-[26px] bg-brown/50 text-white transition-colors hover:bg-brown/70"
          >
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function Contacts() {
  return (
    <div className="py-6 lg:px-[35px] lg:pb-[100px] lg:pt-[50px]">
      <h1 className="font-serif text-xl uppercase leading-[26px] text-ink">Контакти</h1>

      <div className="mt-6 grid gap-10 lg:grid-cols-[594px_468px] lg:gap-x-0">
        <div className="flex flex-col gap-10">
          {CONTACTS.phone && (
            <section>
              <h2 className={heading}>Клієнтська турбота</h2>
              <p className="mt-4">
                <a href={`tel:${phone}`} className={`${value} hover:text-brown`}>
                  {CONTACTS.phone}
                </a>
              </p>
              <p className={muted}>{CONTACTS.phoneHours}</p>
            </section>
          )}

          {MESSENGERS.length > 0 && (
            <section>
              <h2 className={heading}>Для звʼязку в месенджерах</h2>
              <p className={`mt-4 ${muted}`}>{CONTACTS.messengerHours}</p>
              <IconLinks items={MESSENGERS} />
            </section>
          )}

          {SOCIALS.length > 0 && (
            <section>
              <h2 className={heading}>Соцмережі</h2>
              <IconLinks items={SOCIALS} />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-10">
          {CONTACTS.address && (
            <section>
              <h2 className={heading}>Адреса</h2>
              <p className={`mt-4 ${value}`}>{CONTACTS.postcode}</p>
              <p className={muted}>{CONTACTS.address}</p>
            </section>
          )}

          {CONTACTS.email && (
            <section>
              <h2 className={heading}>Пошта</h2>
              <p className="mt-4">
                <a href={`mailto:${CONTACTS.email}`} className={`${muted} hover:text-ink`}>
                  {CONTACTS.email}
                </a>
              </p>
            </section>
          )}

          {CONTACTS.wholesalePhone && (
            <section>
              <h2 className={heading}>Питання щодо гуртової співпраці</h2>
              <p className="mt-4 text-xs leading-[16px]">
                <a href={`tel:${phoneHref(CONTACTS.wholesalePhone)}`} className={`${value} hover:text-brown`}>
                  {CONTACTS.wholesalePhone}
                </a>
                {CONTACTS.wholesaleContact && <span className="text-ink/50"> ({CONTACTS.wholesaleContact})</span>}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
