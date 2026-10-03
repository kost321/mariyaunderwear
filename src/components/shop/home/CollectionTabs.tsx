'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const PAGE = 6

/**
 * "Collection" section: category tabs + a grid of cards and "More".
 * Cards are rendered on the server and arrive as ready nodes; only the filter lives here.
 */
export function CollectionTabs({
  tabs,
  items,
}: {
  tabs: { id: number; title: string }[]
  items: { categoryId: number | null; node: React.ReactNode }[]
}) {
  const [active, setActive] = useState<number | null>(null)
  const [visible, setVisible] = useState(PAGE)

  const filtered = active === null ? items : items.filter((i) => i.categoryId === active)
  const shown = filtered.slice(0, visible)

  const select = (id: number | null) => {
    setActive(id)
    setVisible(PAGE)
  }

  const tabClass = (on: boolean) =>
    cn('whitespace-nowrap text-base transition-colors', on ? 'uppercase text-pink' : 'text-brown hover:text-ink')

  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b border-brown/60 pb-3">
        <div className="-mb-3 flex gap-8 overflow-x-auto pb-3 [scrollbar-width:none]">
          <button type="button" onClick={() => select(null)} className={tabClass(active === null)}>
            ( Всі )
          </button>
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => select(t.id)} className={tabClass(active === t.id)}>
              {t.title}
            </button>
          ))}
        </div>
        <Link href="/catalog" className="hidden shrink-0 text-sm text-ink hover:opacity-70 sm:block">
          Весь каталог<span className="text-brown/60">(+)</span>
        </Link>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-[41px] lg:gap-y-12">{shown.map((i) => i.node)}</div>

      {filtered.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mx-auto mt-12 flex flex-col items-center font-script text-[25px] text-brown/50 transition-opacity hover:opacity-70"
        >
          Більше
          <Image src="/brand/chevron.svg" alt="" width={13} height={7} className="rotate-180 opacity-60" />
        </button>
      )}
    </div>
  )
}
