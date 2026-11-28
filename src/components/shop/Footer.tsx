import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ScrollToTop } from './ScrollToTop'
import { SocialLinks } from './SocialLinks'
import { CONTACTS, phoneHref } from '@/lib/contacts'

type FooterLink = { label: string; href?: string }

// Items without `href` have no page yet: they are shown as plain text until the pages exist.
// Labels: the Footer namespace of src/messages.
const INFO_LINKS = [
  { href: '/contacts', key: 'contacts' },
  { href: '/cooperation', key: 'cooperation' },
  { href: '/#care', key: 'care' },
  { href: '/oferta', key: 'offer' },
  { href: '/privacy', key: 'privacy' },
  { href: '/delivery', key: 'delivery' },
] as const

/** Column of links. */
function LinkList({ items }: { items: FooterLink[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm leading-5 text-sand">
      {items.map((item) => (
        <li key={item.label}>
          {!item.href ? (
            <span>{item.label}</span>
          ) : (
            <Link
              href={item.href}
              // The strip above and below fills the gap between the lines: the whole row is the tap target
              className="relative transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:text-white"
            >
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

const contactLabel = 'text-sm leading-5'
const contactValue = 'mt-0.5 block text-sm leading-5 text-sand/80'

function ContactsBlock() {
  const t = useTranslations('Footer')
  const store = useTranslations('Store')
  return (
    <div className="flex flex-col text-sand">
      <div className="flex flex-col gap-3">
        {CONTACTS.phone && (
          <div>
            <p className={contactLabel}>{t('customerCare')}</p>
            <a href={`tel:${phoneHref(CONTACTS.phone)}`} className={`${contactValue} relative before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:underline`}>
              {CONTACTS.phone}
            </a>
          </div>
        )}
        {CONTACTS.address && (
          <div>
            <p className={contactLabel}>{t('address')}</p>
            <p className={contactValue}>{store('address')}</p>
          </div>
        )}
      </div>

      <SocialLinks items={['instagram', 'email', 'tiktok']} size={22} gap={4} tone="light" className="mt-3" />
    </div>
  )
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm font-medium leading-5 text-sand/80">{title}</p>
      {children}
    </section>
  )
}

export function Footer() {
  const t = useTranslations('Footer')
  const infoLinks: FooterLink[] = INFO_LINKS.map((link) => ({ href: link.href, label: t(link.key) }))
  return (
    <footer className="surface-dark relative mt-12 bg-ink text-sand lg:mt-16">
      <div className="container flex min-h-[190px] flex-col">
        <div className="grid grid-cols-1 gap-y-8 pb-10 pt-10 sm:grid-cols-2 sm:gap-x-10 lg:pb-[35px] lg:pt-[35px]">
          <Column title={t('info')}>
            <LinkList items={infoLinks} />
          </Column>
          <Column title={t('contactsAndSocial')}>
            <ContactsBlock />
          </Column>
        </div>
      </div>

      <ScrollToTop />
    </footer>
  )
}
