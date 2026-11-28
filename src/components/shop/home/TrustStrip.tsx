import { useTranslations } from 'next-intl'
import { Heart, RefreshCw, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type TrustPoint = { icon: LucideIcon; key: 'delivery' | 'payment' | 'returns' | 'madeIn'; href?: string }

/**
 * Store promises under the home page hero. The wording follows the "Оплата, доставка, повернення"
 * page and the checkout; update them together when the terms change. Texts: Trust.* in src/messages.
 */
const TRUST_POINTS: TrustPoint[] = [
  { icon: Truck, key: 'delivery' },
  { icon: Wallet, key: 'payment' },
  // Straight to the returns section of the delivery page
  { icon: RefreshCw, key: 'returns', href: '/delivery#returns' },
  { icon: Heart, key: 'madeIn' },
]

/** Row of four points with icons: two columns on mobile, four on desktop. */
export function TrustStrip() {
  const t = useTranslations('Trust')
  return (
    <section
      aria-label={t('label')}
      className="grid grid-cols-2 gap-x-4 gap-y-8 border-y border-[#d7d7d7] py-8 lg:grid-cols-4 lg:gap-x-9 lg:py-10"
    >
      {TRUST_POINTS.map(({ icon: Icon, key, href }) => {
        const title = t(`${key}.title`)
        const text = t(`${key}.text`)
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
