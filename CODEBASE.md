# Codebase guide: Mariya Underwear

Stack: **Next.js 15** (storefront) + **Payload CMS 3** (admin + API) + **PostgreSQL** (database) + **Cloudinary** (photos).
Payload runs inside the Next.js app, so the storefront, admin panel and API are a single deployable.

---

## Root files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config: allowed image domains (Cloudinary), `withPayload` wrapper |
| `package.json` | Dependencies and scripts: `dev`, `build`, `start` (runs DB migrations before starting) |
| `railway.toml` | Railway deploy config; start command `sh scripts/start.sh` |
| `scripts/start.sh` | Start script: `payload migrate` first, then `next start` |
| `tsconfig.json` | TypeScript config, alias `@/` → `src/` |
| `.env` / `.env.example` | Environment variables (`.env` is not committed) |
| `docker-compose.yml` | Local PostgreSQL for development |
| `.github/workflows/backup.yml` | Nightly encrypted database backup, see [docs/BACKUP.md](docs/BACKUP.md) |

---

## `src/payload.config.ts`

Main Payload CMS config:
- registers all collections (Products, ProductModels, Categories, Materials, Orders, Media, Users) and the `Settings` global
- connects the PostgreSQL adapter (`DATABASE_URI`); schema `push` is on in dev and off in production, where only migrations change the schema
- connects Cloudinary for photo storage
- sets the admin language to Ukrainian
- registers the custom admin view and endpoint for the Torgsoft import

## `src/payload-types.ts`

Generated file with TypeScript types for all collections.
**Do not edit by hand.** Regenerate it with `npm run generate:types`.

---

## Collections `src/collections/`

A collection is a database table + access rules + admin fields.

- **`Products.ts`**: store products. Key fields: `title`, `slug` (auto-generated with transliteration), `sku`, `price`, `wholesalePrice` (admin-only), `active`, `category`, `materials`, `model`, `images`, `sizes[]` (`size`, `stock`), `colors`, `description`, `descriptionHtml`, `careHtml`, `sizeChartHtml`, `relatedProducts`.
  `active: false` hides the product from the site.
- **`ProductModels.ts`**: a model groups several color cards of one product, which powers the color switcher on the product page.
- **`Categories.ts`**: product categories (`title`, `slug`, `image`).
- **`Materials.ts`**: fabric reference list (`title`, `slug`, `showOnHome`, `sortOrder`, `image`, `careText`: care advice shown over the home page card on hover, under it on touch screens). Products link to it (`materials`, hasMany); powers the material line on the product page, the catalog "Матеріал" filter and the fabric block on the home page. The Torgsoft import creates missing materials from the "Матеріал" column.
- **`Orders.ts`**: customer orders. Each line stores a snapshot of title, price, size, color and quantity. `totalPrice` is recalculated on the server. Orders can only be created by the server route `/api/order`.
- **`Media.ts`**: image library stored in Cloudinary. The database keeps only the filename and URL.
- **`Users.ts`**: CMS administrators with access to `/admin`. Customers do not register.

## Globals `src/globals/`

- **`Settings.ts`**: site-wide content, currently the "Delivery and payment" text shown on product pages.

## Custom admin `src/admin/torgsoft-import/`

A custom admin page and sidebar link for importing prices, per-size stock and materials from a Torgsoft Excel/CSV export. The server side lives in `lib/torgsoftImport.ts` and `lib/torgsoftImportEndpoint.ts`.

---

## Storefront `src/app/(frontend)/`

The public part of the site.

- **`layout.tsx`**: shared layout (Header, Footer, CartProvider) and site-wide SEO metadata.
- **`page.tsx`**: home page: hero (store description as the only H1 in a small line, short phrase in large type, one photo of the newest model with color swatches that switch it), trust row (delivery, payment, returns, made in Ukraine), "Новинки" slider, fabric block (Materials with `showOnHome`, placeholders until any are marked), "Про бренд" (draft text in `ABOUT_TEXT`). Rendered on every request.
- **`catalog/page.tsx`**: catalog. `category` and `q` are filtered in Payload; size, color, material, "in stock only" (`stock=in`), price and sorting are applied in memory (`lib/catalog.ts`); orderable products always come before sold-out ones. Search: a field next to the category chips (`CatalogSearch`) filters the grid as you type (debounced `?q=` without a page reload); on /catalog the header's search icon focuses it. No matches → in-stock suggestions.
- **`product/[slug]/page.tsx`**: product page. Uses ISR (`revalidate = 60`), `generateStaticParams`, `generateMetadata`, canonical URL and JSON-LD `Product` markup.
- **`cart/page.tsx`**: cart and checkout.
- **`api/search/route.ts`**: `GET ?q=` live results for the header search panel (short title, price, colour, thumbnail, stock; in-stock suggestions when nothing matches). Same matching as `/catalog?q=`.
- **`order/[token]/page.tsx`**: "order accepted" page (number, what happens next, order lines, details and totals on a warm panel). Opens only with a valid signed token, so order numbers cannot be walked through; noindex, no referrer. Delivery is read back from `comment` ("city | branch | comment") until orders get delivery fields.
- **`api/order/route.ts`**: order endpoint. Validates input, rate-limits by IP, re-reads prices and stock from the database, saves the order and emails the owner. Repeat-safe: the checkout sends an `orderKey` with every retry and `lib/idempotency` returns the already created order instead of a second one (in memory, 30 min). The checkout locks the button while sending, waits up to 30 s and on failure shows the error under the button with a retry, keeping the form. The answer carries a signed `token` (`lib/orderToken`: id + expiry + HMAC with `PAYLOAD_SECRET`, 30 days); the cart then opens `/order/<token>`, and the customer's email links to it.
- **`src/app/robots.ts`, `src/app/sitemap.ts`**: `robots.txt` and `sitemap.xml`.

## Payload `src/app/(payload)/`

Standard Payload files that mount the admin UI and API into Next.js. Rarely edited.

| File | Purpose |
|------|---------|
| `admin/[[...segments]]/page.tsx` | Renders the Payload admin UI at `/admin` |
| `api/[...slug]/route.ts` | Payload REST API |
| `api/graphql/route.ts` | GraphQL API |
| `layout.tsx` | Layout for the admin (separate from the storefront) |

---

## Components `src/components/`

- **`shop/`**: storefront components: `Header`, `MobileMenu`, `Footer`, `ProductCard`, `ProductDetails` (gallery, size/color selection, add to cart), `ProductDescription`, `SizeChart`, `QuickOrderModal`, `QuantityStepper` (the − 1 + capsule shared by the product page and the cart), `CartPage` (cart as a list of rows, summary panel, consent checked on click; empty state waits for `useCart().ready`; checkout: numbered steps, rounded labelled fields, phone mask `+380 (67) 123 45 67` from `lib/phone` `formatUaPhoneInput`, soft Cyrillic hint for names, "Ваше замовлення" panel, collapsed to one line on phones), `FormField` (label above a rounded input, hint or error under it; also used by `CooperationForm`), `ScrollToTop`.
- **`shop/LegalPage.tsx`** + **`shop/LegalToc.tsx`**: layout of the offer and privacy pages: breadcrumbs, title, «Редакція від …», text column of ~70 letters, numbered sections; the contents are sticky on the right on desktop and highlight the section being read.
- **`shop/Breadcrumbs.tsx`**: «Головна / …» trail above page titles (catalog, contacts, cooperation, legal pages).
- **`shop/HeaderSearch.tsx`**: search panel dropped over the page from the header icon (not on /catalog): live results from `/api/search`, "Усі результати" to the catalog; Esc, a click outside or navigation close it.
- **`shop/JsonLd.tsx`**: structured data for Google: `JsonLd` (escaped script tag), `storeLd` (store + site search, home page), `breadcrumbsLd` (category and product pages).
- **`shop/catalog/`**: `CatalogFilters` (sticky sidebar on desktop: size and colour as round buttons, an "in stock only" switch, the price range hidden while every product costs the same).
- **`shop/home/`**: `HeroSection` (first screen in three layouts: a — text + one photo, default; b — two photos; c — banner on the studio backdrop colour; search moved to the header's search icon), `HeroVariantSwitch` (client demo only: `/?hero=a|b|c` shows a floating switch; remove with the unused layouts once one is chosen), `TrustStrip` (store promises under the hero; keep in sync with `/delivery` and the checkout), `ProductSlider`, `ArrowButton`.
- **`ui/button.tsx`**: base button with style variants (CVA).

## Hooks `src/hooks/`

- **`useCart.tsx`**: cart state (items, quantity, total), persisted in `localStorage`.

## Libraries `src/lib/`

| File | Purpose |
|------|---------|
| `queries.ts` | All database queries through the Payload Local API (products, categories, color variants, settings). `getNonEmptyCategories` feeds the menu, catalog chips and sitemap, so empty categories stay hidden |
| `productText.ts` | Tidies product HTML from the admin on the server: description subheadings (short paragraphs without a full stop) become `<h2>`, hyphens become dashes, the characteristics table loses inline styles and multi-paragraph cells become one line; `specValue`/`paragraphs` feed the composition and care in the block under the buy button |
| `colors.ts` | `COLOR_ORDER`: the one colour order for hero swatches, the catalog colour filter and the product page switch; add new colours here |
| `catalog.ts` | In-memory catalog filters and facets; `availableFirst` puts orderable products ahead of sold-out ones (catalog and home) |
| `media.ts` | `getMediaUrl`: builds a Cloudinary URL from a Media object |
| `payload.ts` | Payload initialization for server code (Local API) |
| `cloudinaryAdapter.ts` | Custom Payload storage adapter that uploads files to Cloudinary |
| `slug.ts` | Slug generation with Cyrillic transliteration |
| `torgsoftImport.ts` | Parses and applies a Torgsoft export |
| `torgsoftImportEndpoint.ts` | `POST /api/torgsoft-import` (admins only) |
| `utils.ts` | `formatPrice` (hryvnias), `cn` (class merging) |

## Migrations `src/migrations/`

SQL migrations run by `payload migrate` when the server starts on Railway. In production they are the only thing that changes the schema. Recent ones are written by hand because the Payload generator produced destructive SQL from a drifted snapshot. Verify any generated migration against the real production schema before applying it. `index.ts` is the registry Payload uses to know which migrations have run.

## Types `src/types/`

- **`shop.ts`**: frontend types (`CartItem`, etc.) that Payload does not generate.

---

## Data flow

```
Customer opens /catalog
        ↓
catalog/page.tsx (Server Component)
        ↓
queries.ts → getProducts()
        ↓
Payload Local API → PostgreSQL
        ↓
Returns Product[]
        ↓
ProductCard.tsx renders the cards
        ↓
media.ts → getMediaUrl() builds the Cloudinary URL
        ↓
next/image loads the photo from Cloudinary
```

## Deploy

```
git push github master
        ↓
Railway sees the new commit
        ↓
Runs the build: next build
        ↓
Runs start: sh scripts/start.sh
        ├── payload migrate (creates/updates tables in Railway PostgreSQL)
        └── next start (starts the server)
```
