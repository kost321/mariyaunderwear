import { Instagram, Mail, type LucideIcon } from 'lucide-react'
import { CONTACTS } from '@/lib/contacts'

/** TikTok glyph: lucide has no TikTok icon. Drawn in the same 24px box, filled with currentColor. */
function TikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.5 1.4V6.7A4.5 4.5 0 0 1 16.6 2Z" />
    </svg>
  )
}

type Social = { label: string; href: string; Icon: LucideIcon | typeof TikTok; filled?: boolean }

const ALL: Record<'instagram' | 'email' | 'tiktok', Social> = {
  instagram: { label: 'Instagram', href: CONTACTS.instagram, Icon: Instagram },
  email: { label: 'Email', href: CONTACTS.email && `mailto:${CONTACTS.email}`, Icon: Mail },
  tiktok: { label: 'TikTok', href: CONTACTS.tiktok, Icon: TikTok, filled: true },
}

/**
 * Social icons as plain glyphs, no background circles: the old circle masks turned into grey
 * blobs on the dark footer. Links with an empty href are skipped.
 */
export function SocialLinks({
  items,
  size,
  gap,
  className = '',
  tone = 'dark',
}: {
  items: (keyof typeof ALL)[]
  /** Glyph size in px; the tap area around it is at least 40px */
  size: number
  gap: number
  className?: string
  /** `light` for dark backgrounds (footer), `dark` for white pages */
  tone?: 'dark' | 'light'
}) {
  const links = items.map((key) => ALL[key]).filter((s) => s.href)
  if (!links.length) return null

  return (
    <ul className={`-mx-2 flex ${className}`} style={{ gap }}>
      {links.map(({ label, href, Icon, filled }) => (
        <li key={label}>
          <a
            href={href}
            {...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
            aria-label={label}
            title={label}
            className={`flex min-h-10 min-w-10 items-center justify-center transition-colors ${
              tone === 'light' ? 'text-sand hover:text-white' : 'text-brown hover:text-ink'
            }`}
          >
            {filled ? (
              <Icon className="shrink-0" style={{ width: size, height: size }} />
            ) : (
              <Icon className="shrink-0" style={{ width: size, height: size }} strokeWidth={1.5} aria-hidden />
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
