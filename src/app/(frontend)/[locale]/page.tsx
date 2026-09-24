import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Home')

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Mariya Underwear
      </h1>
      <p className="max-w-md text-muted-foreground">
        {t('tagline1')}
        <br />
        {t('tagline2')}
      </p>
      <Link href="/catalog" className={buttonVariants({ size: 'lg' })}>
        {t('toCatalog')}
      </Link>
    </section>
  )
}
