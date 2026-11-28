import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { HomeLink, StatusScreen, primaryButton } from '@/components/shop/StatusScreen'

/**
 * 404 inside a language: unknown addresses ([...rest]/page.tsx) and missing products.
 * The tab title comes from [...rest]/page.tsx (Next does not take metadata from not-found.tsx there).
 */
export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <StatusScreen
      title="404"
      subtitle={t('title')}
      text={
        <>
          <p>{t('text1')}</p>
          <p>{t('text2')}</p>
        </>
      }
    >
      <Link href="/catalog" className={primaryButton}>
        {t('toCatalog')}
      </Link>
      <HomeLink />
    </StatusScreen>
  )
}
