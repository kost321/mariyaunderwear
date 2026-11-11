import Link from 'next/link'

const button =
  'flex h-[49px] w-full max-w-[257px] items-center justify-center rounded-card font-serif text-[15px] uppercase transition-opacity hover:opacity-80'

/** Dark filled pill ("спробувати ще раз", "до каталогу"). */
export const primaryButton = `${button} bg-ink text-sand`
/** Outlined pill ("на головну"). */
export const secondaryButton = `${button} border-2 border-ink/50 text-ink/50`

/**
 * Full-page status screens from the mockup (error / 404):
 * huge pale word, a short explanation and optional buttons.
 */
export function StatusScreen({
  title,
  subtitle,
  text,
  children,
}: {
  title: string
  /** Smaller second line under the title ("сторінку не знайдено") */
  subtitle?: string
  text: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-serif uppercase leading-none tracking-[2px] text-ink/50">
        <span className="block text-[72px] sm:text-[128px]">{title}</span>
        {subtitle && <span className="mt-2 block text-[28px] sm:text-[44px]">{subtitle}</span>}
      </h1>
      <div className="mt-6 text-sm leading-[26px] text-brown/50">{text}</div>
      {children && (
        <div className="mt-6 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-[59px]">
          {children}
        </div>
      )}
    </div>
  )
}

export function HomeLink() {
  return (
    <Link href="/" className={secondaryButton}>
      На головну
    </Link>
  )
}
