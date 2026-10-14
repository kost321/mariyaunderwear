import type { TextFieldSingleValidation } from 'payload'

/**
 * Поле обов'язкове лише українською (і при створенні документа).
 * Переклади PL/EN можна лишати порожніми — на сайті тоді показується
 * українське значення (localization.fallback у payload.config.ts).
 *
 * Замість `required: true`, яке вимагало б заповнити поле на КОЖНІЙ мові,
 * перш ніж зберегти хоч щось у польській/англійській версії.
 */
export const requiredInDefaultLocale: TextFieldSingleValidation = (value, { req, operation }) => {
  const isDefaultLocale = !req.locale || req.locale === 'uk'
  if ((isDefaultLocale || operation === 'create') && !value?.trim()) {
    return 'Вкажіть назву українською'
  }
  return true
}
