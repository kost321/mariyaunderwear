import Link from 'next/link'
import { Heart, RefreshCw, Truck, Wallet, type LucideIcon } from 'lucide-react'

type TrustPoint = { icon: LucideIcon; title: string; text: string; href?: string }

/**
 * Store promises under the home page hero. The wording follows the "Оплата, доставка, повернення"
 * page and the checkout; update them together when the terms change.
 */
const TRUST_POINTS: TrustPoint[] = [
  { icon: Truck, title: 'Доставка Новою поштою', text: 'по всій Україні, за тарифами перевізника' },
  { icon: Wallet, title: 'Оплата при отриманні', text: 'накладений платіж або передоплата на рахунок ФОП' },
  {
    icon: RefreshCw,
    title: 'Обмін і повернення',
    text: 'протягом 14 днів для речей без слідів використання',
    href: '/delivery',
  },
  { icon: Heart, title: 'Виготовлено в Україні', text: 'Mariya Underwear — український бренд домашнього одягу' },
]

/** Row of four points with icons: two columns on mobile, four on desktop. */
export function TrustStrip() {
  return (
    <section
      aria-label="Доставка, оплата та повернення"
      className="grid grid-cols-2 gap-x-4 gap-y-8 border-y border-[#d7d7d7] py-8 lg:grid-cols-4 lg:gap-x-9 lg:py-10"
    >
      {TRUST_POINTS.map(({ icon: Icon, title, text, href }) => {
        const body = (
          <>
            <Icon className="h-6 w-6 text-brown" strokeWidth={1.25} aria-hidden />
            <p className="mt-3 font-serif text-base text-ink lg:text-lg">{title}</p>
            <p className="mt-1 text-xs leading-5 text-brown lg:text-sm">{text}</p>
          </>
        )
        return href ? (
          <Link key={title} href={href} className="block transition-opacity hover:opacity-80">
            {body}
          </Link>
        ) : (
          <div key={title}>{body}</div>
        )
      })}
    </section>
  )
}
