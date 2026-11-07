import Link from 'next/link'
import { ScrollToTop } from './ScrollToTop'
import { SocialLinks } from './SocialLinks'
import { CONTACTS, phoneHref } from '@/lib/contacts'

type FooterLink = { label: string; href?: string }

// Items without `href` have no page yet: they are shown as plain text until the pages exist.
const INFO_LINKS: FooterLink[] = [
  { href: '/contacts', label: 'Контакти і соцмережі' },
  { href: '/cooperation', label: 'Співпраця' },
  { href: '/#care', label: 'Догляд' },
  { href: '/oferta', label: 'Договір публічної оферти' },
  { href: '/privacy', label: 'Політика конфіденційності' },
  { href: '/delivery', label: 'FAQ' },
]

/** Column of links; `slashes` separates items with "/", as in the "Інформація" column of the design. */
function LinkList({ items, slashes }: { items: FooterLink[]; slashes?: boolean }) {
  return (
    <ul className="flex flex-col text-xs font-medium uppercase leading-[15.6px] text-sand">
      {items.map((item, i) => (
        <li key={item.label} className="flex gap-1">
          {!item.href ? (
            <span className="opacity-60">{item.label}</span>
          ) : (
            <Link href={item.href} className="opacity-60 transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          )}
          {slashes && i < items.length - 1 && <span className="text-[#988b82] opacity-30">/</span>}
        </li>
      ))}
    </ul>
  )
}

const contactLabel = 'text-xs font-medium uppercase leading-[1.2]'
const contactValue = 'text-[10px] leading-none'

function ContactsBlock() {
  return (
    <div className="flex flex-col text-sand">
      <div className="opacity-60">
        {CONTACTS.phone && (
          <>
            <p className={contactLabel}>Клієнтська турбота</p>
            <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={`${contactValue} hover:underline`}>
              {CONTACTS.phone}
            </a>
          </>
        )}
        {CONTACTS.address && (
          <>
            <p className={`mt-1 ${contactLabel}`}>Адреса</p>
            <p className={`max-w-[160px] lowercase ${contactValue}`}>{CONTACTS.address}</p>
          </>
        )}
      </div>

      <SocialLinks items={['instagram', 'email', 'tiktok']} size={26} gap={3.5} className="mt-4" />
    </div>
  )
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <p className="text-[10px] font-bold uppercase leading-[14px] tracking-[0.4px] text-pink opacity-40">{title}</p>
      {children}
    </section>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-20 bg-ink text-sand lg:mt-32">
      <div className="container flex min-h-[190px] flex-col">
        <div className="flex flex-wrap gap-x-10 gap-y-8 pt-10 lg:gap-x-[181px] lg:pl-[117px] lg:pt-[35px]">
          <div className="w-[214px]">
            <Column title="Інформація">
              <LinkList items={INFO_LINKS} slashes />
            </Column>
          </div>
          <Column title="Контакти і соцмережі">
            <ContactsBlock />
          </Column>
        </div>

        <div className="mt-auto flex flex-col gap-2 pb-6 pt-16 lg:pt-5 text-[10px] font-medium lowercase text-sand/40 sm:flex-row sm:justify-center sm:gap-24">
          <p>© {year} — Mariya Underwear</p>
          <p>Всі права захищені</p>
        </div>
      </div>

      <ScrollToTop />
    </footer>
  )
}
