import { cn } from '@/lib/utils'

const STAR = 'M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z'

/** Five stars filled to the rating (fractions too: 4.6 fills 60% of the fifth). */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span role="img" aria-label={`Оцінка ${String(value).replace('.', ',')} з 5`} className={cn('inline-flex gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
            <path d={STAR} fill="none" stroke="#6e5c4d" strokeWidth="1.2" strokeLinejoin="round" />
            {fill > 0 && (
              <path d={STAR} fill="#403834" style={fill < 1 ? { clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` } : undefined} />
            )}
          </svg>
        )
      })}
    </span>
  )
}
