import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Обгортки над next/link і next/navigation, що самі додають мовний
 * префікс: <Link href="/catalog"> → /pl/catalog. На фронті імпортувати
 * Link/useRouter/usePathname звідси, а не з next/*.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
