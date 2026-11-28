import type { routing } from '@/i18n/routing'
import type messages from '@/messages/uk.json'

// Типізація next-intl: ключі перекладів перевіряються TypeScript'ом
// (друкарська помилка в t('…') — помилка компіляції).
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
