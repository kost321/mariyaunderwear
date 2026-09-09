import type { GlobalConfig } from 'payload'

/**
 * Settings — глобальні налаштування магазину (один запис, не колекція).
 * Поки що тут лише текст «Доставка та оплата», спільний для всіх товарів —
 * показується в акордеоні на сторінці кожного товару.
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
      name: 'deliveryPaymentHtml',
      label: 'Доставка та оплата',
      type: 'textarea',
      admin: {
        description:
          'Текст у форматі HTML — абзаци <p>…</p>, списки <ul><li>…</li></ul>, таблиці. Показується в акордеоні «Доставка та оплата» на сторінці кожного товару. Порожньо — секція не показується.',
        rows: 14,
      },
    },
  ],
}
