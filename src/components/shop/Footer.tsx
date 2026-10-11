import Link from 'next/link'
import { ScrollToTop } from './ScrollToTop'

// Items without `href` have no page yet: they are shown as plain text until the pages exist.
const INFO_LINKS: { label: string; href?: string }[] = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/catalog?sort=new', label: 'Новинки' },
  { href: '/cart', label: 'Кошик' },
  { label: 'Контакти' },
  { label: 'Співпраця' },
  { href: '/#care', label: 'Догляд' },
  { label: 'Соцмережі' },
  { label: 'Договір публічної оферти' },
  { label: 'Політика конфіденційності' },
  { label: 'FAQ' },
]

/** List of links separated by "/", as in the design. */
function SlashList({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <ul className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[-0.24px] text-sand">
      {items.map((item, i) => (
        <li key={item.label} className="flex gap-2">
          {item.href ? (
            <Link href={item.href} className="opacity-60 transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          ) : (
            <span className="opacity-60">{item.label}</span>
          )}
          {i < items.length - 1 && <span className="font-light opacity-20">/</span>}
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-20 bg-ink text-sand lg:mt-32">
      <div className="container flex min-h-[420px] flex-col lg:min-h-[628px]">
        <div className="flex flex-col gap-12 pt-16 lg:pl-[117px] lg:pt-[126px]">
          <section className="flex flex-col gap-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-pink opacity-40">Інфо</p>
            <SlashList items={INFO_LINKS} />
          </section>
        </div>

        <div className="mt-auto flex flex-col gap-2 pb-6 pt-16 text-[10px] font-medium lowercase text-sand/40 sm:flex-row sm:justify-center sm:gap-24">
          <p>© {year} — Mariya Underwear</p>
          <p>Всі права захищені</p>
        </div>
      </div>

      <ScrollToTop />
    </footer>
  )
}
