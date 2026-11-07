import Image from 'next/image'
import Link from 'next/link'

const button =
  'flex h-[49px] w-full max-w-[257px] items-center justify-center rounded-card font-serif text-[15px] uppercase transition-opacity hover:opacity-80'

/** Dark filled pill ("спробувати ще раз", "до каталогу"). */
export const primaryButton = `${button} bg-ink text-sand`
/** Outlined pill ("на головну"). */
export const secondaryButton = `${button} border-2 border-ink/50 text-ink/50`

/**
 * Full-page status screens from the mockup (error / 404 / loading):
 * huge pale word, a short explanation and optional buttons.
 */
export function StatusScreen({
  title,
  subtitle,
  text,
  children,
}: {
  title: string
  /** Smaller second line under the title ("not found") */
  subtitle?: string
  text: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-serif uppercase leading-none tracking-[2px] text-ink/50">
        <span className="block text-[72px] sm:text-[128px]">{title}</span>
        {subtitle && <span className="mt-1 block text-[40px] sm:mt-0 sm:text-[72px]">{subtitle}</span>}
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

/**
 * Loading screen for loading.tsx. Used only on pages that never return 404 (home, catalog):
 * a loading.tsx makes Next stream the page, so notFound() below it would answer 200 instead of 404.
 * The spinner turns in 12 steps, one per petal.
 */
export function LoadingScreen() {
  return (
    <StatusScreen title="loading" text={<p role="status">Зачекайте, будь ласка, ми готуємо сторінку</p>}>
      <Image
        src="/brand/spinner.png"
        alt=""
        width={65}
        height={65}
        priority
        className="opacity-80 [animation:spin_1s_steps(12)_infinite] motion-reduce:animate-none"
      />
    </StatusScreen>
  )
}
