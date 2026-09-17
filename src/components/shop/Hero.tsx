import Image from 'next/image'
import Link from 'next/link'
import heroImage from '../../../public/hero/hero.jpg'

/**
 * Hero-секція головної сторінки. Фото на всю ширину з темним градієнтом
 * знизу і зліва для читабельності тексту, заголовок шрифтом Cormorant
 * Garamond, лейбли й кнопки — Manrope в аптейсі з розрядкою (фірмовий
 * стиль бренду з макету Figma).
 */
export function Hero() {
  return (
    <section className="relative flex h-[1200px] items-end overflow-hidden bg-sand">
      <Image
        src={heroImage}
        alt="Модель у домашньому одязі Mariya Underwear"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%]"
      />
      {/* Градієнти для контрастності тексту — знизу вгору і зліва направо. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/0" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" />

      <div className="relative w-full px-6 pb-20 sm:px-12">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="text-[11px] uppercase tracking-[2.42px] text-shell/75">
            Колекція осінь — зима 2026
          </p>
          <h1 className="mt-3 whitespace-nowrap font-display text-4xl font-light leading-[1.02] text-shell sm:text-5xl lg:text-6xl xl:text-[86px]">
            Відчувай любов
            <br />з Mariya Underwear
          </h1>
          <p className="mt-6 max-w-sm text-[15px] font-light leading-[1.8] text-shell/80">
            Шовк, батист і європейське мереживо. Домашній одяг, у якому
            хочеться залишитися на цілий день.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/catalog"
              className="flex h-[49px] items-center justify-center bg-shell px-8 text-[11px] uppercase tracking-[2.42px] text-ink transition-opacity hover:opacity-90"
            >
              Дивитись каталог
            </Link>
            <Link
              href="/catalog"
              className="flex h-[49px] items-center justify-center border border-shell/60 px-8 text-[11px] uppercase tracking-[2.42px] text-shell transition-colors hover:bg-shell/10"
            >
              Комплекти
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
