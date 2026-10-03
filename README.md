# Mariya Underwear — e-commerce store on Next.js + Payload CMS

A production online store for a Ukrainian lingerie and homewear brand, built from scratch to replace a Tilda site.
Next.js 15 storefront and Payload CMS 3 admin run as a **single application**, backed by PostgreSQL and deployed on Railway.

**Live:** [mariyaunderwear.com](https://mariyaunderwear.com/) · 🚧 *Active development: some sections are still in progress*

<!-- Screenshots: replace with your own -->
| Home | Product page | Admin |
|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Product](docs/screenshots/product.png) | ![Admin](docs/screenshots/admin.png) |

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15 (App Router, React Server Components), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| CMS / backend | Payload CMS 3 (embedded in Next.js: admin panel, REST and GraphQL API, Local API) |
| Database | PostgreSQL 16 (Docker locally), Payload migrations |
| Media | Cloudinary via a custom storage adapter, `sharp` for image sizes |
| Email | Resend (order notifications) |
| Deploy | Railway: migrations run automatically before start |
| Ops | Nightly database backup via GitHub Actions ([restore guide](docs/BACKUP.md)) |

## Features

**Storefront**
- Home, catalog and product pages implemented from Figma designs
- Catalog with category chips, filters, sorting and search
- Product page with gallery, size and color selection, size chart, care info and related products ("frequently bought together")
- Color variants: each color is its own product card (own slug, photos, SEO), grouped under a shared *Product Model* to power the color switcher
- Cart with localStorage persistence, checkout with delivery details (city / Nova Poshta branch), and a quick-order modal
- **Stock-aware ordering:** sizes with no stock are disabled, quantity is capped at the available stock, and the same check is repeated on the server
- **SEO:** `sitemap.xml`, `robots.txt`, JSON-LD `Product` markup, canonical URLs, `generateMetadata` and `generateStaticParams` for product pages

**Orders**
- Orders are created through a server endpoint that **trusts the client only for product ID, size, color and quantity**. Titles and prices are always re-read from the database, so a tampered cart can't change what the customer pays.
- Each order line stores a **snapshot** of title and price, so order history stays correct after products are edited
- Request validation and **rate limiting** on the order endpoint; public order creation through the CMS API is closed
- Email notification via Resend to recipients from `ORDER_NOTIFY_EMAIL`. Customer fields are escaped, and a failed email never breaks order creation

**Admin and integrations**
- **Torgsoft import:** a custom admin view that accepts an Excel/CSV export from the Torgsoft POS/accounting system and syncs retail prices, wholesale prices and per-size stock into products. Products are matched by SKU and color, and the import returns a detailed report: updated, not found, ambiguous and skipped rows.
- One-off migration scripts: product import from Tilda, media migration to Cloudinary
- Localized (Ukrainian) admin with grouped collections and field-level hints for non-technical editors
- Global `Settings` for site-wide content (delivery and payment info, etc.)

## Data model

```
ProductModels ──< Products >── Categories
                     │
                     ├── images → Media (Cloudinary)
                     ├── sizes[] (size, stock)
                     └── relatedProducts → Products

Orders ── products[] (product ref + title/price snapshot, size, color, qty)
Users  ── admin accounts
Settings (global)
```

## Project structure

```
src/
  app/
    (frontend)/        storefront: home, catalog, product, cart, order API
    (payload)/         Payload admin (/admin) and REST / GraphQL API
  admin/               custom admin views (Torgsoft import)
  collections/         Products, ProductModels, Categories, Orders, Media, Users
  globals/             Settings
  components/shop/     storefront components
  lib/                 data queries, Torgsoft import, Cloudinary adapter, utils
  migrations/          versioned DB migrations
scripts/               Tilda import, Cloudinary migration, start script
```

## Getting started

Requirements: Node.js 20+, Docker.

```bash
git clone https://github.com/kost321/mariyaunderwear.git
cd mariyaunderwear
npm install
cp .env.example .env      # fill in DATABASE_URI, PAYLOAD_SECRET, Cloudinary and Resend keys
npm run db:up             # start PostgreSQL in Docker
npm run dev               # http://localhost:3000, admin at /admin
```

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (storefront + admin) |
| `npm run build` / `npm start` | Production build / start (runs migrations first) |
| `npm run db:up` / `db:down` | Start / stop local PostgreSQL |
| `npm run generate:types` | Regenerate TypeScript types from collections |

## Roadmap

- [ ] Finish remaining storefront pages and polish mobile layouts
- [ ] Open Graph metadata
- [ ] Telegram notifications for new orders

---

Built by **Kostya** · [GitHub](https://github.com/kost321). Published with the store owner's permission.
