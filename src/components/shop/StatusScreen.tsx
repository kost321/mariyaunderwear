import Link from 'next/link'

// The same pair of buttons as in "Про бренд" on the home page
const button = 'flex h-11 w-full max-w-[240px] items-center justify-center rounded-card text-sm transition-colors'

/** Dark filled pill ("спробувати ще раз", "до каталогу"). */
export const primaryButton = `${button} bg-ink text-white hover:bg-ink/90`
/** Outlined pill in the text colour ("на головну"). */
export const secondaryButton = `${button} border border-brown/50 text-brown hover:border-ink hover:text-ink`

/**
 * Full-page status screens (error / 404): a large muted code in the warm sand of the palette, the title in
 * the page-title style (normal case, like "Каталог"), a short explanation in the body text colour and buttons.
 * With a subtitle the code is decoration and the subtitle is the page's h1.
 */
export function StatusScreen({
  title,
  subtitle,
  text,
  children,
}: {
  title: string
  /** The page title under the code ("Сторінку не знайдено"); without it the title itself is the h1 */
  subtitle?: string
  text: React.ReactNode
  children?: React.ReactNode
}) {
  const code = 'font-serif text-[96px] leading-none text-sand sm:text-[160px]'
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      {subtitle ? (
        <>
          <p aria-hidden className={code}>
            {title}
          </p>
          <h1 className="heading-page mt-4">{subtitle}</h1>
        </>
      ) : (
        <h1 className={code}>{title}</h1>
      )}
      <div className="mt-5 max-w-[520px] text-balance text-base leading-7 text-brown">{text}</div>
      {children && (
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
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
