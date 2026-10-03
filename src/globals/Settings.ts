import type { GlobalConfig } from 'payload'

/**
 * Settings: global store settings (a single record, not a collection).
 * For now it only holds the "Delivery and payment" text shared by all products,
 * shown in the accordion on every product page.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Налаштування',
  admin: {
    group: 'Каталог',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Доставка та оплата',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'deliveryPaymentHtml',
          label: 'Доставка та оплата',
          type: 'textarea',
          admin: {
            description:
              'Текст у форматі HTML — абзаци <p>…</p>, списки <ul><li>…</li></ul>, таблиці. Раніше показувався в акордеоні «Доставка та оплата» на сторінці кожного товару; зараз секція на сайті прихована, поле лишили в адмінці на майбутнє.',
            rows: 14,
          },
        },
      ],
    },
  ],
}
