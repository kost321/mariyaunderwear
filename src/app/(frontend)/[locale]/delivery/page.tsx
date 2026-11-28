import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { alternates } from '@/lib/seo'
import { RefreshCw, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { Breadcrumbs } from '@/components/shop/Breadcrumbs'
import { JsonLd, breadcrumbsLd } from '@/components/shop/JsonLd'
import { LegalToc } from '@/components/shop/LegalToc'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Delivery' })
  return { title: t('title'), description: t('description'), alternates: alternates(locale, '/delivery') }
}

// Not prerendered at build time: the layout pulls menu categories from the DB (see cart/page.tsx)
export const dynamic = 'force-dynamic'

// Text from the design mockup (it repeats sections 4–6 and 3.5 of the public offer, see /oferta): change both pages together.
// Like the offer, the text is Ukrainian only; on /pl and /en the titles are translated (Delivery.*) and a note says so.
// A plain item is a bullet; { lead, sub } is a bullet with a nested list (numbered when it is a sequence of steps).
type Item = React.ReactNode | { lead: React.ReactNode; sub: React.ReactNode[]; ordered?: boolean }

type Section = { id: 'delivery' | 'payment' | 'returns'; icon: LucideIcon; items: Item[] }

// Icons match the trust strip on the home page (components/shop/home/TrustStrip)
const SECTIONS: Section[] = [
  {
    id: 'delivery',
    icon: Truck,
    items: [
      "Товар по Україні доставляється курʼєрською службою «Нова пошта», можлива доставка іншими курʼєрами. Способи, а також вартість доставки Товарів вказані на офіційних вебсайтах курʼєрських служб.",
      "Обовʼязок Продавця передати товар Покупцю вважається виконаним в момент отримання Покупцем відправлення.",
      "При прийнятті Замовлення від курʼєра, Покупець зобовʼязаний оглянути доставлений Товар і перевірити його на відповідність заявленій якості, асортименту та комплектності, а також цілісність упаковки. Якщо претензій до доставленого Товару немає, Покупець розписується в супровідних документах. Підпис у супровідних документах свідчить про те, що претензій до Товару Покупець не заявлено і Продавець повністю і належним чином виконав свій обовʼязок щодо передачі Товару.",
      'Користувач розуміє і погоджується з тим, що Продавець продає товарні позиції в більшості випадків зі свого складу, а також Продавець може продавати Товарні позиції Третіх сторін, при цьому Продавець виконує послугу купівлі товарних позицій в третіх сторін та надає послугу з організації доставки.',
    ],
  },
  {
    id: 'payment',
    icon: Wallet,
    items: [
      'Ціна товару вказується в гривнях і включає всі витрати, необхідні для виконання Продавцем своїх послуг.',
      'Сума замовлення складається з вартості товарів та витрат, необхідних для передачі товарних позицій до курʼєрської служби в Україні.',
      "Ціна Товарної позиції вказується на вебсайті. Якщо фактична ціна відрізняється від вказаної на сайті, тоді Продавець інформує про це Покупця для підтвердження Замовлення за виправленою ціною або анулювання Замовлення. При неможливості звʼязатися з Покупцем це Замовлення вважається анульованим.",
      'Ціна Товару на вебсайті може бути змінена Продавцем в односторонньому порядку. При цьому ціна на замовлений Покупцем Товар зміні не підлягає.',
      {
        lead: 'Оплата Товару здійснюється Покупцем:',
        sub: [
          'передоплатою на рахунок Продавця за реквізитами, які менеджер надає після підтвердження Замовлення;',
          'накладеним платежем при одержанні Замовлення у відділенні «Нової пошти» в сумі, що відповідає сумі Замовлення.',
        ],
      },
      'Спосіб оплати Покупець обирає при оформленні Замовлення. Остаточно спосіб оплати погоджується з менеджером по телефону під час підтвердження Замовлення.',
      'Продавець має право надавати знижки на Товари та встановлювати програму бонусів. Види знижок, бонусів, порядок і умови нарахування визначаються Продавцем самостійно і вказані на Сайті і можуть бути змінені Продавцем в односторонньому порядку.',
    ],
  },
  {
    id: 'returns',
    icon: RefreshCw,
    items: [
      'Використаний товар поверненню не підлягає, з чим повністю погоджується Покупець. Використаним вважається товар, на якому помітні явні сліди використання (сліди носіння чи прання, плями, запахи, пошкодження тощо).',
      {
        lead: 'Піжами, які не були у використанні та в яких збережено товарний вигляд, споживчі властивості, упаковку, ярлики, а також розрахунковий документ, можна повернути або обміняти протягом 14 днів з дня отримання. Умови та порядок повернення:',
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
          'Дата зворотної відправки не повинна перевищувати 14-денний термін від дати отримання Покупцем замовленого товару.',
          'Вартість зворотної доставки повинен оплатити Покупець при відправці.',
        ],
      },
      'Протягом 7 днів після отримання повернутого товару Покупцю буде повернуто суму, яку він оплачував при оформленні замовлення, за реквізитами, які Покупець вказав в Заяві на повернення товару.',
      'Інша білизна належної якості після отримання поверненню та обміну не підлягає (Перелік непродовольчих товарів належної якості, що не підлягають обміну (поверненню), затверджений постановою Кабінету Міністрів України від 19.03.1994 № 172). Покупець може оглянути такий товар у відділенні «Нової пошти» під час отримання і, якщо він не підійшов, відмовитися від нього. У такому разі Продавець замінює товар або повертає сплачені кошти.',
      'Якщо Покупець відмовився від передоплаченого Замовлення у відділенні «Нової пошти» під час отримання, повертається вся сплачена сума. В інших випадках із суми повернення утримується вартість доставки. Кожен випадок розглядається індивідуально.',
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

export default async function Delivery({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Delivery' })
  const legal = await getTranslations({ locale, namespace: 'Legal' })
  const home = (await getTranslations({ locale, namespace: 'Common' }))('home')
  const sections = SECTIONS.map((s) => ({ ...s, title: t(`sections.${s.id}`) }))

  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd(
          [
            { name: home, url: '/' },
            { name: t('title'), url: '/delivery' },
          ],
          locale,
        )}
      />
      <Breadcrumbs items={[{ name: home, href: '/' }, { name: t('title') }]} />
      <h1 className="heading-page mt-2">{t('title')}</h1>
      {locale !== 'uk' && (
        <p className="mt-4 max-w-[60ch] rounded-card bg-[#f4efeb] px-6 py-4 text-sm leading-6 text-ink">
          {legal('ukrainianOnly')}
        </p>
      )}

      {/* Same layout as the legal pages (LegalPage): ~70-letter text column, sticky contents on the right */}
      <div className="mt-8 flex flex-col gap-10 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,60ch)_minmax(0,320px)] lg:justify-between lg:gap-16">
        <LegalToc
          items={sections.map(({ id, title }) => ({ id, title }))}
          numbered={false}
          className="lg:sticky lg:top-8 lg:order-2 lg:self-start"
        />

        <div className="flex flex-col gap-10 lg:order-1">
          {sections.map(({ id, title, icon: Icon, items }) => (
            <section key={id} id={id} className="scroll-mt-6">
              <h2 className="flex items-center gap-3 text-lg font-medium text-ink">
                <Icon className="h-6 w-6 shrink-0 text-brown" strokeWidth={1.25} aria-hidden />
                {title}
              </h2>
              <ul lang="uk" className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-brown marker:text-brown/50">
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
