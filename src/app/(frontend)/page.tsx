import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Магазин одежды OLGA
      </h1>
      <p className="max-w-md text-muted-foreground">
        Новая коллекция уже в каталоге. Платья, куртки и аксессуары ручного отбора.
      </p>
      <Link href="/catalog" className={buttonVariants({ size: 'lg' })}>
        Перейти в каталог
      </Link>
    </section>
  )
}
