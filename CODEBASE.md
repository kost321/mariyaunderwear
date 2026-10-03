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
| `scripts/import-tilda.mjs` | One-off import of products from a Tilda CSV |
| `scripts/migrate-to-cloudinary.mjs` | One-off migration of local photos to Cloudinary |
| `scripts/diagnose-delete.mjs` | Diagnostic for product deletion errors (runs in a rolled-back transaction) |
| `tsconfig.json` | TypeScript config, alias `@/` → `src/` |
| `.env` / `.env.example` | Environment variables (`.env` is not committed) |
| `docker-compose.yml` | Local PostgreSQL for development |
| `.github/workflows/backup.yml` | Nightly encrypted database backup, see [docs/BACKUP.md](docs/BACKUP.md) |

---

## `src/payload.config.ts`

Main Payload CMS config:
- registers all collections (Products, ProductModels, Categories, Orders, Media, Users) and the `Settings` global
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

- **`Products.ts`**: store products. Key fields: `title`, `slug` (auto-generated with transliteration), `sku`, `price`, `wholesalePrice` (admin-only), `active`, `category`, `model`, `images`, `sizes[]` (`size`, `stock`), `colors`, `description`, `descriptionHtml`, `careHtml`, `sizeChartHtml`, `relatedProducts`.
  `active: false` hides the product from the site.
- **`ProductModels.ts`**: a model groups several color cards of one product, which powers the color switcher on the product page.
- **`Categories.ts`**: product categories (`title`, `slug`, `image`).
- **`Orders.ts`**: customer orders. Each line stores a snapshot of title, price, size, color and quantity. `totalPrice` is recalculated on the server. Orders can only be created by the server route `/api/order`.
- **`Media.ts`**: image library stored in Cloudinary. The database keeps only the filename and URL.
- **`Users.ts`**: CMS administrators with access to `/admin`. Customers do not register.

## Globals `src/globals/`

- **`Settings.ts`**: site-wide content, currently the "Delivery and payment" text shown on product pages.

## Custom admin `src/admin/torgsoft-import/`

A custom admin page and sidebar link for importing prices and per-size stock from a Torgsoft Excel/CSV export. The server side lives in `lib/torgsoftImport.ts` and `lib/torgsoftImportEndpoint.ts`.

---

## Storefront `src/app/(frontend)/`

The public part of the site.

- **`layout.tsx`**: shared layout (Header, Footer, CartProvider) and site-wide SEO metadata.
- **`page.tsx`**: home page: hero, collection tabs, "our approach" block. Rendered on every request.
- **`catalog/page.tsx`**: catalog. `category` and `q` are filtered in Payload; size, color, price and sorting are applied in memory (`lib/catalog.ts`).
- **`product/[slug]/page.tsx`**: product page. Uses ISR (`revalidate = 60`), `generateStaticParams`, `generateMetadata`, canonical URL and JSON-LD `Product` markup.
- **`cart/page.tsx`**: cart and checkout.
- **`api/order/route.ts`**: order endpoint. Validates input, rate-limits by IP, re-reads prices and stock from the database, saves the order and emails the owner.
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

- **`shop/`**: storefront components: `Header`, `MobileMenu`, `Footer`, `ProductCard`, `ProductDetails` (gallery, size/color selection, add to cart), `ProductDescription`, `SizeChart`, `QuickOrderModal`, `CartPage`, `RichText`, `ScrollToTop`.
- **`shop/catalog/`**: `CatalogFilters`.
- **`shop/home/`**: `HeroSection`, `CollectionTabs`, `ProductSlider`, `ArrowButton`.
- **`ui/button.tsx`**: base button with style variants (CVA).

## Hooks `src/hooks/`

- **`useCart.tsx`**: cart state (items, quantity, total), persisted in `localStorage`.

## Libraries `src/lib/`

| File | Purpose |
|------|---------|
| `queries.ts` | All database queries through the Payload Local API (products, categories, color variants, settings) |
| `catalog.ts` | In-memory catalog filters and facets |
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
