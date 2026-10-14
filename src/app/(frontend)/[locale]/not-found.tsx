import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('text')}</p>
      <Link href="/catalog" className={buttonVariants()}>
        {t('toCatalog')}
      </Link>
    </section>
  )
}
