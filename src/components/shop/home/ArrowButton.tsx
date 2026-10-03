import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Round arrow button (carousel "back / forward"), as in the design. */
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
      {/* chevron.svg points up, so rotate it */}
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
