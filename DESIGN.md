# DESIGN.md — Mariya Underwear

Visual identity and UI rules for the storefront. Read before changing anything a shopper sees.
The source of truth is the Figma mockup (the original "maria" file); this file records how it is
implemented in code and the decisions made on top of it. When Figma and this file disagree on
something listed under "Decisions", this file wins.

## Brand

Women's nightwear and homewear from Ukraine. Soft, warm, calm, a little nostalgic; never loud,
never "tech". Copy is Ukrainian first (Polish and English translations at /pl and /en), addressed to the shopper as «ви» (PL: Ty-form, EN: plain "you"). The interface should feel made
by hand for one small brand, not assembled from a template.

## Color

Tokens live in `tailwind.config.ts` and `src/app/(frontend)/globals.css`. Use tokens, not new hex
values.

| Token | Hex | Use |
|---|---|---|
| `ink` | `#403834` | Primary buttons, active chips, icons, focus ring, main text on light |
| `ink-text` | `#403434` | Headings (`heading-page`, `heading-section`) |
| `brown` | `#6e5c4d` | Secondary text, labels, hints, outlined button text |
| `sand` | `#d3c3b6` | Lines, dividers, decorative fills |
| `cream` | `#f3ebe8` | Soft panels |
| `#f4efeb` | — | Tinted section/card background ("Про бренд", empty states) |
| `pink` | `#f2afc6` | Rare accent only (badges); never for text or large areas |
| `placeholder` | `#b6ada3` | Photo placeholders (`bg-placeholder/40`) |
| `destructive` | `#B3402E` | Errors only: muted brick red that stays in the warm palette |

- Background is white. No gradients, no purple/blue, no glassmorphism, no neon.
- Text must pass WCAG AA (4.5:1). `brown` on white passes; `brown/50` and lighter only for
  placeholders and disabled states.
- Dark surfaces (footer, photo viewer) carry `.surface-dark` so the focus ring turns white.

## Typography

- `font-serif` = **Podkova** (headings, product names in titles, prices where the design shows it).
- `font-sans` = **Inter** (everything else: body, buttons, labels, navigation).
- The script font exists only inside the logo image. Do not add a third family.
- Headings use the shared classes: `.heading-page` (h1 on content pages, 36/48 px) and
  `.heading-section` (32/48 px). Normal case, no letter-spacing, no ALL CAPS anywhere except the logo.
- Body text 14–15 px; small print 12–13 px. Long text columns ≤ ~70 characters per line.

## Shape

- Pill (`rounded-full`): buttons, inputs, chips, size/color selectors, quantity stepper.
- `rounded-card` (26 px): product photos, cards, tinted panels, modals (`rounded-t-card` on the
  mobile bottom sheet).
- No sharp corners, no dashed borders, no heavy shadows. Shadow only on floating controls
  (`shadow-[0_2px_8px_rgba(64,56,52,0.25)]`) and modals.
- Product photos: 3:4, no border, fill the card edge to edge.

## Components

Reuse before building. Key pieces:

| Need | Use |
|---|---|
| Text field with label, hint, error | `FormField` / `inputClass` (`src/components/shop/FormField.tsx`) |
| Product tile | `ProductCard` |
| Quantity | `QuantityStepper` (capped by stock) |
| Page crumbs | `Breadcrumbs` |
| Modal / bottom sheet | Follow `QuickOrderModal` / `SizeChart`: bottom sheet on mobile, centered card on desktop, focus trapped, Esc closes, `overscroll-contain` |
| Success / error full screen | `StatusScreen` |

Buttons:
- **Primary**: `rounded-full bg-ink text-white hover:bg-ink/90`, height 44–48 px on main actions.
  Dark and obviously active; never grey for an enabled button.
- **Secondary**: `rounded-full border border-brown/40 text-brown hover:border-ink hover:text-ink`.
- Labels in sentence case and specific: «Додати в кошик», «Оформити замовлення», not «Далі»/«OK».

Forms:
- Label above the field (placeholders disappear while typing), `*` on required fields.
- Errors: our own message under the field in `destructive`, `role="alert"`, the border turns red.
  No browser tooltips, one error style everywhere.
- Phone: mask `+380 (XX) XXX XX XX`. Correct `type`, `inputMode`, `autoComplete`.

## Layout

- Container: centered, max 1280 px, side gutter `var(--gutter)` (18 px mobile → 50 px desktop).
- Check every change at **390 px** and **1440 px**.
- Touch targets ≥ 44 px on mobile (an invisible `::before` hit area is fine).
- Mobile: no horizontal page scroll; sticky buy bar on the product page must not cover content.

## Motion

Quiet and short. The brand is calm, so motion is feedback, not decoration.

- Animate only `transform` and `opacity` (colors on hover are fine). Never `transition: all`.
- Hover/color: 150–200 ms. Dropdowns/popovers: 150–250 ms, `ease-out`. Modals, drawers, toasts:
  up to 300–400 ms. Never `ease-in` on UI.
- Enter from `scale(0.95)` + `opacity: 0`, never from `scale(0)`. Exit faster than enter.
- Hover-only effects behind `@media (hover: hover)` so taps on phones don't stick.
- `prefers-reduced-motion` is handled globally in `globals.css` (spinners keep turning). Do not
  override it.
- No parallax, no autoplaying carousels, no scroll-jacking, no confetti.

## Copy

- Ukrainian, «ви», short sentences. Quotes «ялинки», ellipsis `…`, apostrophe `'` (as in «пам'ять»).
- All shopper-facing text lives in `src/messages/{uk,pl,en}.json` (next-intl); write the Ukrainian
  first, then the same meaning in PL/EN. Polish quotes „…”, English “…”.
- Prices: `1 250 грн` (PL/EN: `1 250 UAH`) via `formatPrice(value, t('Common.currency'))` (`src/lib/utils.ts`). Not `Intl.NumberFormat`: its output
  differs between Node and the browser and breaks hydration (overrides the Vercel `Intl.*` rule).
- Product naming: «Нічна сорочка «Ранкова ніжність»», then color · size; the same order everywhere.
- Error messages say what to do next («Вкажіть номер у форматі +380…»), not just what is wrong.
- No English in the Ukrainian UI («Електронна пошта», not «Email»).

## Decisions (override Figma or generic guidelines)

- **Contacts: phone, email, Instagram, TikTok only.** No Telegram/WhatsApp/Viber, even if Figma
  shows them.
- **Payment choice is informational**: the shopper picks prepay/COD only so the manager can
  prepare; the method is agreed by phone. Don't build online payment UI.
- **No title case.** Vercel's Web Interface Guidelines suggest Chicago Title Case; Ukrainian uses
  sentence case. Ignore that rule here.
- Returns: only what `/delivery` and `/oferta` say; short promises elsewhere must match them.

## Anti-patterns (reject in review)

- Generic AI look: purple/blue gradients, emoji icons, glass cards, everything centered, three
  identical feature cards with icons.
- ALL CAPS or letter-spaced headings/buttons; a third font.
- New hex colors instead of tokens; grey enabled buttons; dashed borders.
- Empty placeholder cards shipped to production.
- `div` with `onClick` instead of `button`/`Link`; icon buttons without `aria-label`; inputs
  without a label; `outline-none` without a visible focus replacement.

## Tools

- `/audit` (`.claude/commands/audit.md`, `npm run audit`): browser audit with axe and screenshots.
- `.claude/skills/web-design-guidelines`: code review against Vercel's Web Interface Guidelines.
- `.claude/skills/emil-design-eng`: interaction and animation polish (Emil Kowalski).
