import Image from 'next/image'
import Link from 'next/link'
import { CONTACTS } from '@/lib/contacts'
import { ScrollToTop } from './ScrollToTop'

type FooterLink = { label: string; href?: string; external?: boolean }

// Items without `href` have no page yet: they are shown as plain text until the pages exist.
const INFO_LINKS: FooterLink[] = [
  { href: '/cooperation', label: 'Співпраця' },
  { href: '/#care', label: 'Догляд' },
  { label: 'Договір публічної оферти' },
  { label: 'Політика конфіденційності' },
  { label: 'FAQ' },
]

// Empty contacts are hidden (see lib/contacts); while there are none, the column leads to the contact form
const FILLED_CONTACTS: FooterLink[] = [
  { href: `tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}`, label: CONTACTS.phone },
  { href: `mailto:${CONTACTS.email}`, label: CONTACTS.email },
].filter((link) => link.label)
const CONTACT_LINKS: FooterLink[] =
  FILLED_CONTACTS.length > 0 ? FILLED_CONTACTS : [{ href: '/cooperation', label: 'Форма звʼязку' }]

const SOCIAL_LINKS: FooterLink[] = [
  { href: CONTACTS.instagram || undefined, label: 'Instagram', external: true },
  { href: CONTACTS.tiktok || undefined, label: 'TikTok', external: true },
]

/** Column of links; `slashes` separates items with "/", as in the "Інформація" column of the design. */
function LinkList({ items, slashes }: { items: FooterLink[]; slashes?: boolean }) {
  return (
    <ul className="flex flex-col text-xs font-medium uppercase leading-[15.6px] text-sand">
      {items.map((item, i) => (
        <li key={item.label} className="flex gap-1">
          {!item.href ? (
            <span className="opacity-60">{item.label}</span>
          ) : item.href.startsWith('/') ? (
            <Link href={item.href} className="opacity-60 transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          ) : (
            <a
              href={item.href}
              {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
              className={`opacity-60 transition-opacity hover:opacity-100 ${item.href.startsWith('mailto:') ? 'normal-case' : ''}`}
            >
              {item.label}
            </a>
          )}
          {slashes && i < items.length - 1 && <span className="text-[#988b82] opacity-30">/</span>}
        </li>
      ))}
    </ul>
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
      <div className="container flex min-h-[300px] flex-col">
        <div className="pt-10 lg:pl-[117px] lg:pt-[37px]">
          <Link href="/" aria-label="Mariya Underwear — на головну" className="block w-fit">
            <Image
              src="/brand/logo.jpg"
              alt="Mariya underwear"
              width={164}
              height={53}
              className="h-[34px] w-[105px] mix-blend-darken lg:h-[53px] lg:w-[164px]"
            />
          </Link>
        </div>

        <div className="grid gap-12 pt-12 sm:grid-cols-3 sm:gap-8 lg:grid-cols-[366px_366px_auto] lg:gap-0 lg:pl-[117px] lg:pt-[36px]">
          <Column title="Інформація">
            <LinkList items={INFO_LINKS} slashes />
          </Column>
          <Column title="Контакти">
            <LinkList items={CONTACT_LINKS} />
          </Column>
          <Column title="Соцмережі">
            <LinkList items={SOCIAL_LINKS} />
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
