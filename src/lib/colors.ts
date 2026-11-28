/**
 * The one order of colours across the site, light to dark: hero swatches, the catalog colour filter
 * and the colour switch on the product page all follow it. Names are matched case-insensitively.
 * A colour missing from the list goes after the listed ones, alphabetically: add new colours here.
 *
 * Colour names are translated in the admin (Products.colorName is localized), so each place holds
 * the Ukrainian name and its usual Polish and English translations.
 */
export const COLOR_ORDER: string[][] = [
  ['молочний', 'mleczny', 'milky', 'milk'],
  ['чайна роза', 'herbaciana róża', 'tea rose'],
  ['бежевий', 'beżowy', 'beige'],
  ['кавовий', 'kawowy', 'coffee'],
  ['синій', 'granatowy', 'niebieski', 'blue', 'navy'],
  ['чорний', 'czarny', 'black'],
]

const RANK = new Map(COLOR_ORDER.flatMap((names, i) => names.map((name) => [name, i] as const)))

const rank = (name: string | null | undefined): number =>
  RANK.get((name ?? '').trim().toLowerCase()) ?? COLOR_ORDER.length

/** Comparator for Array.sort: by COLOR_ORDER, unknown colours alphabetically after it. */
export function compareColors(a: string | null | undefined, b: string | null | undefined): number {
  return rank(a) - rank(b) || (a ?? '').localeCompare(b ?? '', 'uk')
}

/** A copy of `items` sorted by colour (stable: items of one colour keep their order). */
export function sortByColor<T>(items: T[], name: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => compareColors(name(a), name(b)))
}
