# Olga Shop — статус проекта

Интернет-магазин одежды на **Next.js 15 (App Router) + Payload CMS 3 + PostgreSQL**.
Payload встроен как backend внутри Next.js (admin + REST/GraphQL API в одном приложении).

Дата обновления: 2026-06-17

---

## ✅ Что создано

### Инфраструктура и конфигурация
- [x] `package.json` — Next 15.4.11 + Payload 3.85.1 (версии согласованы по peer-зависимостям), Tailwind, утилиты shadcn, sharp
- [x] `docker-compose.yml` — PostgreSQL 16 (healthcheck, volume для данных)
- [x] `.env` / `.env.example` — `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`
- [x] `tsconfig.json` — алиасы `@/*` и `@payload-config`
- [x] `next.config.mjs` — обёртка `withPayload`
- [x] `tailwind.config.ts`, `postcss.config.mjs`, `globals.css` (тема shadcn)
- [x] `.gitignore` (исключает генерируемый `payload-types.ts`)

### Payload CMS — коллекции (`src/collections/`)
- [x] **Products** — title, slug (автогенерация с транслитерацией кириллицы), description (richText), price, images (галерея), category (relationship), sizes (массив), colors (массив {name, hex}), sku, active
- [x] **Categories** — title, slug, image
- [x] **Orders** — customerName, phone, email, comment, products (снимки названия/цены/размера/цвета/кол-ва), totalPrice (пересчёт на сервере в `beforeChange`), status (new / processing / completed / cancelled), orderNumber (автогенерация)
- [x] **Media** — загрузка фото, превью (thumbnail / card / full) через sharp, alt-текст
- [x] **Users** — администраторы CMS (auth)
- [x] `payload.config.ts` — postgres-адаптер, lexical-редактор, регистрация коллекций
- [x] Служебные роуты Payload в `src/app/(payload)/` — админка `/admin`, REST `/api`, GraphQL

### Слой данных и утилиты (`src/lib/`, `src/hooks/`, `src/types/`)
- [x] `lib/payload.ts` — доступ к Local API из серверного кода
- [x] `lib/queries.ts` — getProducts, getProductBySlug, getCategories, getAllProductSlugs (фильтр active)
- [x] `lib/media.ts` — извлечение URL/alt из Media-объектов
- [x] `lib/slug.ts` — транслитерация + slugify
- [x] `lib/utils.ts` — `cn`, `formatPrice`
- [x] `hooks/useCart.tsx` — корзина на localStorage (add / remove / updateQuantity / clear, счётчики)
- [x] `types/shop.ts` — типы CartItem, CheckoutForm

### Фронтенд (`src/app/(frontend)/`)
- [x] Layout магазина — CartProvider, Header со счётчиком корзины, footer, базовое SEO
- [x] Главная страница `/`
- [x] **Каталог** `/catalog` — Server Component, получение товаров из Payload, фильтр по категориям, адаптивная сетка (2 кол. моб. / 4 десктоп)
- [x] **Карточка товара** `/product/[slug]` — галерея с миниатюрами, выбор размера и цвета, «в корзину», richText-описание, SEO (`generateMetadata` + `generateStaticParams`)
- [x] UI-компоненты: Button (shadcn), ProductCard, ProductDetails, RichText, Header

### Проверки
- [x] `npm install` — зависимости установлены
- [x] `payload generate:types` — типы сгенерированы
- [x] `payload generate:importmap` — карта компонентов админки сгенерирована
- [x] `tsc --noEmit` — типы чистые (exit 0)
- [x] `npm run build` — код компилируется полностью (падает только на подключении к БД при SSG — это инфраструктура, не баг кода)

---

## 🔧 Что нужно сделать (следующие шаги)

### 1. Запустить окружение (требуется один раз)
- [ ] Установить **Docker Desktop** (сейчас Docker в системе отсутствует)
- [ ] `npm run db:up` — поднять PostgreSQL
- [ ] `npm run dev` — запустить сайт
- [ ] Открыть `http://localhost:3000/admin` → создать первого администратора (таблицы создадутся автоматически)
- [ ] Добавить категории и товары в админке

### 2. Корзина и оформление заказа (директории созданы, но пустые)
- [ ] Страница корзины `/cart` — список позиций, изменение количества, удаление, итоговая сумма (логика `useCart` уже готова)
- [ ] Страница оформления `/checkout` — форма (имя, телефон, email, комментарий)
- [ ] Server Action для приёма заказа → запись в коллекцию `Orders` (коллекция уже принимает публичные создания: `create: () => true`)
- [ ] Очистка корзины после успешного заказа + страница «спасибо»

### 3. Уведомления о заказах (отложено по решению на старте)
- [ ] Сейчас заказы видны только в админке Payload (раздел «Заказы»)
- [ ] Позже: email- или Telegram-уведомление владельцу при новом заказе

### 4. Доработки перед продакшеном
- [ ] Заменить `PAYLOAD_SECRET` на длинный случайный (`openssl rand -base64 32`)
- [ ] Перенести загрузку медиа на постоянное хранилище (S3/облако) — сейчас файлы в `public/media`
- [ ] Настроить домены для `next/image` в `next.config.mjs`, если медиа будет на внешнем хосте
- [ ] `robots.txt`, `sitemap.xml`, расширенные метаданные/Open Graph
- [ ] Перенос контента с Tilda (категории, товары, фото)
- [ ] `npm audit` — разобрать уязвимости зависимостей

---

## Полезные команды

| Команда | Назначение |
|---|---|
| `npm run dev` | Запуск сайта (фронт + админка) |
| `npm run build` | Production-сборка |
| `npm run db:up` / `npm run db:down` | Поднять / остановить PostgreSQL в Docker |
| `npm run generate:types` | Перегенерировать типы после изменения коллекций |
| `npx payload generate:importmap` | Обновить карту компонентов админки |

## Структура проекта

```
src/
  app/
    (frontend)/        — публичный сайт (каталог, товар, корзина, checkout)
    (payload)/         — админка /admin и API Payload
  collections/         — коллекции Payload (Products, Categories, Orders, Media, Users)
  components/
    ui/                — базовые UI (shadcn)
    shop/              — компоненты магазина
  lib/                 — payload, queries, media, slug, utils
  hooks/               — useCart
  types/               — UI-типы магазина
  payload.config.ts    — конфиг Payload
```
