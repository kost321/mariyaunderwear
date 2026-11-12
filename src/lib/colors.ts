/**
 * The one order of colours across the site, light to dark: hero swatches, the catalog colour filter
 * and the colour switch on the product page all follow it. Names are matched case-insensitively.
 * A colour missing from the list goes after the listed ones, alphabetically: add new colours here.
 */
export const COLOR_ORDER = ['молочний', 'чайна роза', 'бежевий', 'кавовий', 'синій', 'чорний']

const rank = (name: string | null | undefined): number => {
  const i = COLOR_ORDER.indexOf((name ?? '').trim().toLowerCase())
  return i === -1 ? COLOR_ORDER.length : i
}

/** Comparator for Array.sort: by COLOR_ORDER, unknown colours alphabetically after it. */
export function compareColors(a: string | null | undefined, b: string | null | undefined): number {
  return rank(a) - rank(b) || (a ?? '').localeCompare(b ?? '', 'uk')
}

/** A copy of `items` sorted by colour (stable: items of one colour keep their order). */
export function sortByColor<T>(items: T[], name: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => compareColors(name(a), name(b)))
}
