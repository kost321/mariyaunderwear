# Структура проекта OLGA Shop

Технологии: **Next.js 15** (фронтенд) + **Payload CMS 3** (админка + API) + **PostgreSQL** (БД) + **Cloudinary** (фото).

---

## Корневые файлы

| Файл | Что делает |
|------|-----------|
| `next.config.mjs` | Конфиг Next.js — разрешённые домены для изображений (Cloudinary), обёртка withPayload |
| `package.json` | Зависимости + скрипты: `dev`, `build`, `start` (запускает миграции БД перед стартом) |
| `railway.toml` | Конфиг деплоя на Railway — команда старта `sh scripts/start.sh` |
| `scripts/start.sh` | Скрипт старта: сначала `payload migrate`, потом `next start` |
| `tsconfig.json` | Конфиг TypeScript, алиас `@/` → `src/` |
| `.env` | Локальные переменные окружения (не коммитятся в git) |
| `docker-compose.yml` | Локальная PostgreSQL для разработки |

---

## `src/payload.config.ts`

Главный конфиг Payload CMS. Здесь:
- регистрируются все коллекции (Products, Categories, Orders, Media, Users)
- подключается PostgreSQL адаптер (`DATABASE_URI`)
- подключается Cloudinary для хранения фото
- настраивается язык админки (украинский)

---

## `src/payload-types.ts`

Автогенерированный файл — TypeScript типы для всех коллекций.  
**Не редактировать вручную.** Обновляется командой `npm run generate:types`.  
Используется по всему проекту: `import type { Product, Category } from '@/payload-types'`

---

## Коллекции `src/collections/`

Коллекция = таблица в БД + правила доступа + поля в админке.

### `Products.ts`
Главная коллекция — товары магазина.  
Поля: `title`, `slug`, `sku`, `price`, `active`, `category`, `images`, `sizes`, `colors`, `description`.
- `slug` генерируется автоматически из названия через хук `beforeValidate`
- `active: false` — товар не показывается на сайте
- `sizes` и `colors` — массивы (array field)
- `images` — массив ссылок на Media

### `Categories.ts`
Категории товаров: Піжами, Халати, Нічні сорочки, Комплект.  
Поля: `title`, `slug`, `image`.

### `Orders.ts`
Заказы покупателей.  
Поля: `customerName`, `phone`, `email`, `address`, `products` (какие товары), `total`, `status` (new/processing/done/cancelled).

### `Media.ts`
Медиатека изображений.  
При загрузке файл уходит на Cloudinary (не на сервер). В БД хранится только `filename` и `url`.  
Поле `alt` — текст для SEO и доступности.

### `Users.ts`
Администраторы — люди с доступом к `/admin`.  
Регистрация закрыта: создать нового пользователя может только уже залогиненный админ.

---

## Мультимовність (uk / pl / en)

- **URL:** всі сторінки фронту під мовним префіксом — `/uk/…`, `/pl/…`, `/en/…`. `src/middleware.ts` (next-intl) редіректить `/` і шляхи без префікса: cookie `NEXT_LOCALE` (вибір у перемикачі, живе рік) → мова браузера → `uk`. `/admin` і `/api` middleware не чіпає.
- **Тексти інтерфейсу:** `src/messages/{uk,pl,en}.json`. У компонентах — `useTranslations('Ns')` / `getTranslations('Ns')`; ключі типізовані (`src/global.d.ts`), помилка в ключі = помилка TS. Новий текст → додати ключ у всі три файли.
- **Посилання:** `Link`, `useRouter`, `usePathname` імпортувати з `@/i18n/navigation` (не з `next/link`) — вони самі додають префікс мови.
- **Контент (Payload `localization`):** localized-поля — назва, колір, опис, характеристика, розмірна таблиця, догляд (Products), назва (Categories), alt (Media). В адмінці мова перемикається в шапці документа. Назва обов'язкова лише українською (`src/lib/localization.ts`); порожній переклад → на сайті українське значення (`fallbackLocale: 'uk'` у `lib/queries.ts`). slug спільний для всіх мов.
- **Замовлення** (`api/order`) зберігаються й надсилаються менеджеру українською, незалежно від мови сайту.
- **Список мов** задано у двох місцях — `src/i18n/routing.ts` і `localization` у `payload.config.ts`; змінювати разом (+ міграція enum `_locales`).

## Фронтенд `src/app/(frontend)/[locale]/`

Публичная часть сайта — то что видят покупатели. `api/order/route.ts` лежит вне `[locale]`.

### `layout.tsx`
Корневой layout публичных страниц.  
Содержит: `<html lang={locale}>`, `NextIntlClientProvider`, Header (с перемикачем мови `LanguageSwitcher`), Footer, CartProvider.  
Здесь же глобальные SEO метаданные (title, description, hreflang через `lib/seo.ts`, og:locale).

### `page.tsx`
Главная страница `/{locale}` — название магазина, короткое описание, кнопка "Перейти до каталогу".

### `catalog/page.tsx`
Страница каталога `/{locale}/catalog`.
- Получает товары и категории из БД на сервере
- Рендерит фильтр по категориям (через `?category=slug` в URL)
- Рендерит сетку карточек товаров

### `product/[slug]/page.tsx`
Страница отдельного товара `/{locale}/product/название-товара`.
- `generateStaticParams` — при билде генерирует все мови × все slug для SSG
- `generateMetadata` — динамические SEO теги для каждого товара
- Рендерит `ProductDetails` и описание товара

---

## Админка `src/app/(payload)/`

Служебная часть — Payload CMS UI и API.  
**Не трогать** — это стандартные файлы Payload, они просто "подключают" админку к Next.js.

| Файл | Что делает |
|------|-----------|
| `admin/[[...segments]]/page.tsx` | Рендерит UI админки Payload на `/admin` |
| `api/[...slug]/route.ts` | REST API Payload (`/api/products`, `/api/users` и т.д.) |
| `api/graphql/route.ts` | GraphQL API |
| `layout.tsx` | Layout для админки (отдельный от фронтенда) |

---

## Компоненты `src/components/`

### `shop/Header.tsx`
Шапка сайта — логотип OLGA, ссылка на Каталог, иконка корзины со счётчиком.  
Клиентский компонент (`'use client'`) потому что читает состояние корзины.

### `shop/ProductCard.tsx`
Карточка товара в сетке каталога — фото, название, цена, ссылка на страницу товара.  
Серверный компонент (нет интерактива).

### `shop/ProductDetails.tsx`
Интерактивная часть страницы товара:
- галерея фото с миниатюрами
- выбор размера
- выбор цвета (цветные кружки)
- кнопка "До кошика"

Клиентский компонент (`'use client'`).

### `shop/RichText.tsx`
Рендерит rich text (описание товара с форматированием) — конвертирует внутренний формат Payload Lexical в HTML.

### `ui/button.tsx`
Базовый компонент кнопки с вариантами стилей (CVA).

---

## Хуки `src/hooks/`

### `useCart.tsx`
Всё состояние корзины: список товаров, количество, сумма.  
Хранится в `localStorage` — корзина не пропадает после перезагрузки страницы.  
Экспортирует: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalCount`, `totalPrice`.

---

## Библиотеки `src/lib/`

### `queries.ts`
Все запросы к БД через Payload Local API.  
Функции: `getProducts`, `getProductBySlug`, `getCategories`, `getAllProductSlugs`.  
Только серверный код (`'server-only'`).

### `media.ts`
Хелпер `getMediaUrl` — получает Cloudinary URL из объекта Media.  
Логика: если `url` начинается с `https` — возвращает как есть, иначе строит URL из `filename`.

### `payload.ts`
Инициализация Payload для использования в серверных компонентах (Local API).

### `cloudinaryAdapter.ts`
Кастомный адаптер для Payload — при загрузке файла отправляет его на Cloudinary вместо локального диска.

### `slug.ts`
Утилита для генерации slug из украинского текста (транслитерация).

### `utils.ts`
Общие утилиты: `formatPrice(value, currency)` (цена в гривнах; подпись валюты — `t('Common.currency')`: «грн» / «UAH»), `cn` (объединение CSS классов).

---

## Миграции `src/migrations/`

### `20260618_141301.ts`
SQL миграция — полная структура всех таблиц БД.  
Выполняется командой `payload migrate` при старте сервера на Railway.  
Генерируется автоматически командой `npm run payload migrate:create`.

### `index.ts`
Реестр всех миграций — Payload читает его чтобы знать какие миграции уже выполнены.

---

## Типы `src/types/`

### `shop.ts`
Дополнительные TypeScript типы для фронтенда (CartItem и т.д.) которые не генерируются Payload автоматически.

---

## Поток данных

```
Покупатель открывает /catalog
        ↓
catalog/page.tsx (Server Component)
        ↓
queries.ts → getProducts()
        ↓
Payload Local API → PostgreSQL
        ↓
Возвращает массив Product[]
        ↓
ProductCard.tsx рендерит карточки
        ↓
media.ts → getMediaUrl() строит Cloudinary URL
        ↓
next/image загружает фото с Cloudinary
```

---

## Деплой

```
git push github master
        ↓
Railway видит новый коммит
        ↓
Запускает build: next build
        ↓
Запускает start: sh scripts/start.sh
        ├── payload migrate (создаёт/обновляет таблицы в Railway PostgreSQL)
        └── next start (запускает сервер на порту 8080)
```
