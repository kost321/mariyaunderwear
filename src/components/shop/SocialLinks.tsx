import { CONTACTS } from '@/lib/contacts'

type Social = { label: string; href: string; mask: string }

// Icons from the design are alpha masks (circle with the glyph cut out), tinted via background color
const ALL: Record<'instagram' | 'email' | 'tiktok', Social> = {
  instagram: { label: 'Instagram', href: CONTACTS.instagram, mask: '/brand/social/instagram.png' },
  email: { label: 'Email', href: CONTACTS.email && `mailto:${CONTACTS.email}`, mask: '/brand/social/mail.png' },
  tiktok: { label: 'TikTok', href: CONTACTS.tiktok, mask: '/brand/social/tiktok.png' },
}

/** Round social icons; links with an empty href are skipped. */
export function SocialLinks({
  items,
  size,
  gap,
  className = '',
}: {
  items: (keyof typeof ALL)[]
  size: number
  gap: number
  className?: string
}) {
  const links = items.map((key) => ALL[key]).filter((s) => s.href)
  if (!links.length) return null

  return (
    <ul className={`flex ${className}`} style={{ gap }}>
      {links.map((s) => {
        const mask = `url(${s.mask}) center / contain no-repeat`
        return (
          <li key={s.label}>
            <a
              href={s.href}
              {...(s.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
              aria-label={s.label}
              title={s.label}
              className="block bg-brown/50 transition-colors hover:bg-brown"
              style={{ width: size, height: size, mask, WebkitMask: mask }}
            />
          </li>
        )
      })}
    </ul>
  )
}
