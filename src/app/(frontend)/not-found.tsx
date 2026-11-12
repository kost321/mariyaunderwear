import type { Metadata } from 'next'
import Link from 'next/link'
import { HomeLink, StatusScreen, primaryButton } from '@/components/shop/StatusScreen'

export const metadata: Metadata = {
  title: 'Сторінку не знайдено',
}

/** 404: unknown addresses (see [...slug]/page.tsx) and missing products. */
export default function NotFound() {
  return (
    <StatusScreen
      title="404"
      subtitle="Сторінку не знайдено"
      text={
        <>
          <p>Можливо, посилання застаріло або адресу введено з помилкою.</p>
          <p>Поверніться на головну або перегляньте каталог.</p>
        </>
      }
    >
      <Link href="/catalog" className={primaryButton}>
        До каталогу
      </Link>
      <HomeLink />
    </StatusScreen>
  )
}
