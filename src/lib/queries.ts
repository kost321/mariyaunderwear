import 'server-only'

import type { Where } from 'payload'
import { getPayload } from './payload'
import type { Product, Category } from '@/payload-types'

/**
 * Слой доступа к данным. Все запросы товаров/категорий идут через эти
 * функции — так фронтенд не знает деталей Payload, а правила фильтрации
 * (например, only active) лежат в одном месте.
 */

/** Получить список активных товаров (для каталога). */
export async function getProducts(options?: {
  categorySlug?: string
  limit?: number
}): Promise<Product[]> {
  const payload = await getPayload()

  // Базовый фильтр: только активные товары.
  const where: Where = {
    active: { equals: true },
  }

  // Опциональная фильтрация по категории через её slug.
  if (options?.categorySlug) {
    where['category.slug'] = { equals: options.categorySlug }
  }

  const result = await payload.find({
    collection: 'products',
    where,
    limit: options?.limit ?? 100,
    sort: '-createdAt',
    // depth: 2 — подтянуть связанные media и category объектами,
    // а не просто их id.
    depth: 2,
  })

  // Каждый товар (в т.ч. каждый цвет модели) показывается в каталоге
  // отдельной плиткой. Связь цветов работает только на странице товара
  // через переключатель (getColorVariants).
  return result.docs
}

/** Получить один товар по slug (для карточки товара). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    limit: 1,
    depth: 2,
  })

  return result.docs[0] ?? null
}

/**
 * Все карточки одной модели (варианты цвета).
 * Каждый цвет — самостоятельный товар со своим slug; связаны полем `model`
 * (relationship на коллекцию product-models).
 * Возвращаются в том же порядке, в каком заведены в админке.
 */
export async function getColorVariants(
  modelId: number | string,
): Promise<Product[]> {
  if (!modelId) return []

  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: {
      model: { equals: modelId },
      active: { equals: true },
    },
    limit: 20,
    sort: 'createdAt',
    depth: 1,
  })

  return result.docs
}

/** Получить все категории (для меню/фильтра). */
export async function getCategories(): Promise<Category[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
    depth: 1,
  })

  return result.docs
}

/** slug всех активных товаров — для generateStaticParams (SSG/SEO). */
export async function getAllProductSlugs(): Promise<string[]> {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'products',
    where: { active: { equals: true } },
    limit: 1000,
    depth: 0,
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean) as string[]
}
