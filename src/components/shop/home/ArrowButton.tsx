import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Кругла кнопка зі стрілкою (карусель «назад / вперед»), як у макеті. */
export function ArrowButton({
  direction,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { direction: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Назад' : 'Вперед'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-brown transition-opacity hover:bg-cream disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {/* chevron.svg дивиться вгору — повертаємо */}
      <Image
        src="/brand/chevron.svg"
        alt=""
        width={13}
        height={7}
        className={direction === 'prev' ? '-rotate-90' : 'rotate-90'}
      />
    </button>
  )
}
