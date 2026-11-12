import type { Metadata } from 'next'
import Link from 'next/link'
import { RefreshCw, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { LegalToc } from '@/components/shop/LegalToc'

export const metadata: Metadata = {
  title: 'Оплата, доставка, повернення',
  description: 'Доставка «Новою поштою», оплата та умови повернення товару в Mariya Underwear.',
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

// Text from the design mockup (it repeats sections 4–6 of the public offer, see /oferta).
// A plain item is a bullet; { lead, sub } is a bullet with a nested list (numbered when it is a sequence of steps).
type Item = React.ReactNode | { lead: React.ReactNode; sub: React.ReactNode[]; ordered?: boolean }

type Section = { id: string; title: string; icon: LucideIcon; items: Item[] }

// Icons match the trust strip on the home page (components/shop/home/TrustStrip)
const SECTIONS: Section[] = [
  {
    id: 'delivery',
    title: 'Доставка замовлення',
    icon: Truck,
    items: [
      "Товар по Україні доставляється кур'єрською службою «Нова пошта», можлива доставка іншими кур'єрами. Способи, а також вартість доставки Товарів вказані на офіційних Веб сайтах кур’єрських служб.",
      "Обов'язок Продавця передати товар Покупцю вважається виконаним в момент отримання Покупцем відправлення.",
      "При прийнятті Замовлення від кур'єра, Покупець зобов'язаний оглянути доставлений Товар і перевірити його на відповідність заявленій якості, асортименту та комплектності Товару, а також перевірити термін служби доставленого Товару і цілісність упаковки. У разі відсутності претензій до доставленому Товару, Покупець розписується в постачальних документах. Підпис в постачальних документах свідчить про те, що претензій до Товару Покупець не заявлено і Продавець повністю і належним чином виконав свій обов'язок щодо передачі Товару.",
      'Користувач розуміє і погоджується з тим, що Продавець продає товарні позиції в більшості випадків зі свого складу, а також Продавець може продавати Товарні позиції Третіх сторін, при цьому Продавець виконує послугу купівлі товарних позицій в третіх сторін та надає послугу з організації доставки.',
    ],
  },
  {
    id: 'payment',
    title: 'Оплата товару',
    icon: Wallet,
    items: [
      'Ціна товару вказується в гривнях і включає в себе всі витрати, необхідні для виконння Продавцем своїх послуг.',
      'Сума замовлення складається з вартості товарів та витрат, необхідних для передачі товарних позицій до кур’єрської служби в Україні.',
      "Ціна Товарної позиції вказується на Веб-сайті. Якщо фактична ціна відрізнється від вказаної на сайті, тоді Продавець інформує про це Покупця для підтвердження Замовлення за виправленною ціною або анулювання Замовлення. При неможливості зв'язатися з Покупцем дане Замовлення вважається анульованим.",
      'Ціна Товару на Веб-сайті може бути змінена Продавцем в односторонньому порядку. При цьому ціна на замовлений Покупцем Товар зміні не підлягає.',
      {
        lead: 'Оплата Товару здійснюється Покупцем:',
        sub: [
          'Готівковими коштами при одержанні Замовлення в сумі, що відповідає сумі Замовлення;',
          'Безготівковими коштами з використанням банківських карт при оформленні Замовлення в сумі, що відповідає сумі Замовлення.',
          'Оплата безготівковими коштами реалізується з використанням сервісу онлайн оплати від АТ КБ «Приватбанк» — liqpay.ua.',
        ],
      },
      'Додаткову комісію при онлайн оплаті сплачує Продавець.',
      'Продавець має право надавати знижки на Товари та встановлювати програму бонусів. Види знижок, бонусів, порядок і умови нарахування визначаються Продавцем самостійно і вказані на Сайті і можуть бути змінені Продавцем в односторонньому порядку.',
    ],
  },
  {
    id: 'returns',
    title: 'Повернення товару та грошових коштів',
    icon: RefreshCw,
    items: [
      'Використаний товар поверненню не підлягає, з чим повністю погоджується Покупець. Використаним вважається товар, на якому помітні явні сліди використання (потертості, подряпини, пошкодження, відсутність захисних плівок чи конструкцій тощо).',
      {
        lead: 'Товарні позиції які не були у використанні, можна повернути протягом 14 днів. Умови та порядок повернення товарів:',
        ordered: true,
        sub: [
          <>
            Для того, щоб повернути товари, Покупець повинен повідомити Адміністрацію інтернет-магазину за контактами,
            вказаними на сторінці{' '}
            <Link href="/contacts" className="text-ink underline underline-offset-2 hover:no-underline">
              Контакти
            </Link>
            .
          </>,
          'Для можливості повернення товару Покупець повинен відправити на вказану адміністрацією адресу: товар належної якості, який не був у використанні в упаковці без пошкоджень, фіскальний чек, усі документи, які були в упаковці, Заява на повернення товару.',
          'Дата зворотньої відправки не повинна перевищувати 14-денний термін від дати отримання Покупцем замовленого товару.',
          'Вартість зворотньої доставки повинен оплатити Покупець при відправці.',
        ],
      },
      'Після отримання повернутого товару протягом 30 робочих банківських днів Покупцю буде повернуто суму, яку він оплачував при оформленні замовлення за реквізитами, які Покупець вказав в Заяві на повернення товару.',
    ],
  },
]

const isNested = (item: Item): item is Extract<Item, { sub: React.ReactNode[] }> =>
  typeof item === 'object' && item !== null && 'sub' in item

/** Nested list under a bullet: numbered for step-by-step procedures, hollow bullets for options. */
function SubList({ items, ordered }: { items: React.ReactNode[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <List className={`mt-2 space-y-2 pl-5 ${ordered ? 'list-decimal marker:text-brown/70' : 'list-[circle] marker:text-brown/50'}`}>
      {items.map((sub, i) => (
        <li key={i} className="pl-1">
          {sub}
        </li>
      ))}
    </List>
  )
}

export default function Delivery() {
  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd([
          { name: 'Головна', url: '/' },
          { name: 'Оплата і доставка', url: '/delivery' },
        ])}
      />
      <Breadcrumbs items={[{ name: 'Головна', href: '/' }, { name: 'Оплата і доставка' }]} />
      <h1 className="heading-page mt-2">Оплата і доставка</h1>

      {/* Same layout as the legal pages (LegalPage): ~70-letter text column, sticky contents on the right */}
      <div className="mt-8 flex flex-col gap-10 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,60ch)_minmax(0,320px)] lg:justify-between lg:gap-16">
        <LegalToc
          items={SECTIONS.map(({ id, title }) => ({ id, title }))}
          numbered={false}
          className="lg:sticky lg:top-8 lg:order-2 lg:self-start"
        />

        <div className="flex flex-col gap-10 lg:order-1">
          {SECTIONS.map(({ id, title, icon: Icon, items }) => (
            <section key={id} id={id} className="scroll-mt-6">
              <h2 className="flex items-center gap-3 text-lg font-medium text-ink">
                <Icon className="h-6 w-6 shrink-0 text-brown" strokeWidth={1.25} aria-hidden />
                {title}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-brown marker:text-brown/50">
                {items.map((item, i) =>
                  isNested(item) ? (
                    <li key={i} className="pl-1">
                      {item.lead}
                      <SubList items={item.sub} ordered={item.ordered} />
                    </li>
                  ) : (
                    <li key={i} className="pl-1">
                      {item as React.ReactNode}
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
