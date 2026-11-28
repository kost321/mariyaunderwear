// Page pass: every page at both widths — screenshot, console, network, axe and the in-page checks.
import { AxeBuilder } from '@axe-core/playwright'
import { BASE, WIDTHS, open, shot } from './lib.js'
import { pageChecks } from './page-checks.js'

export function pageList(products) {
  return [
    ['home', '/'],
    ['catalog', '/catalog'],
    ['catalog-empty-search', '/catalog?q=qwertyzz'],
    products.inStock && ['product-instock', `/product/${products.inStock}`],
    products.soldOut && ['product-soldout', `/product/${products.soldOut}`],
    products.noPhoto && products.noPhoto !== products.inStock && ['product-nophoto', `/product/${products.noPhoto}`],
    ['cart-empty', '/cart'],
    ['contacts', '/contacts'],
    ['cooperation', '/cooperation'],
    ['delivery', '/delivery'],
    ['oferta', '/oferta'],
    ['privacy', '/privacy'],
    ['404', '/this-page-does-not-exist'],
    ['404-product', '/product/no-such-product'],
  ].filter(Boolean)
}

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export async function runCrawl(browser, products, only) {
  const pages = pageList(products).filter(([name]) => !only || only.includes(name))
  const results = {}
  for (const width of WIDTHS) {
    for (const [name, url] of pages) {
      const { ctx, page, log } = await open(browser, width)
      const started = Date.now()
      let status = null
      try {
        status = (await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 90000 }))?.status() ?? null
      } catch (e) {
        log.pageErrors.push('goto: ' + e.message.slice(0, 200))
      }
      const loadMs = Date.now() - started
      await page.waitForTimeout(800)
      const checks = await page.evaluate(pageChecks)
      let axe
      try {
        const report = await new AxeBuilder({ page }).withTags(AXE_TAGS).exclude('nextjs-portal').analyze()
        axe = report.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          count: v.nodes.length,
          nodes: v.nodes.slice(0, 5).map((n) => ({
            target: n.target.join(' '),
            summary: n.failureSummary?.split('\n').slice(1, 2).join(' ').trim().slice(0, 200),
          })),
        }))
      } catch (e) {
        axe = [{ id: 'axe-failed', help: e.message.slice(0, 200) }]
      }
      const screenshot = await shot(page, name, width)
      results[`${name}@${width}`] = { url, width, status, loadMs, screenshot, ...log, axe, ...checks }
      console.log(`  ${name}@${width}: HTTP ${status}, axe ${axe.length}, console ${log.console.length}, errors ${log.pageErrors.length}`)
      await ctx.close()
    }
  }
  return results
}

/** Short per-page digest of what needs a look; the full data stays in the JSON. */
export function summarizeCrawl(results) {
  const lines = []
  for (const [key, r] of Object.entries(results)) {
    const issues = []
    const expected404 = key.startsWith('404')
    if (expected404 ? r.status !== 404 : r.status !== 200) issues.push(`HTTP ${r.status}`)
    if (r.pageErrors.length) issues.push(`JS errors: ${r.pageErrors.length}`)
    const consoleNoise = r.console.filter((c) => !(expected404 && c.includes('404')))
    if (consoleNoise.length) issues.push(`console: ${consoleNoise.length}`)
    const failed = r.failed.filter((f) => !(expected404 && f.includes(r.url)))
    if (failed.length) issues.push(`failed requests: ${failed.length}`)
    if (r.scrollWidth > r.innerWidth || r.overflowing.length) issues.push(`horizontal overflow (${r.overflowing.length})`)
    if (r.axe.length) issues.push(`axe: ${r.axe.map((a) => `${a.id}×${a.count ?? '?'}`).join(', ')}`)
    if (r.leftovers.length) issues.push(`leftover words: ${r.leftovers.join(', ')}`)
    if (r.imagesWithoutAlt.length) issues.push(`img without alt: ${r.imagesWithoutAlt.length}`)
    if (r.imagesNotNext.length) issues.push(`img not via next/image: ${r.imagesNotNext.length}`)
    if (r.caps.length) issues.push(`caps/tracking: ${r.caps.length}`)
    if (r.dashed.length) issues.push(`dashed borders: ${r.dashed.length}`)
    if (r.sharpControls.length) issues.push(`sharp controls: ${r.sharpControls.length}`)
    if (r.longLines.length) issues.push(`long lines: ${r.longLines.length}`)
    if (r.fieldsWithoutLabel.length) issues.push(`fields without label: ${r.fieldsWithoutLabel.length}`)
    if (r.controlsWithoutName.length) issues.push(`controls without name: ${r.controlsWithoutName.length}`)
    if (r.width < 1000 && r.smallTargets.length) issues.push(`tap targets <44px: ${r.smallTargets.length}`)
    if (!r.description) issues.push('no meta description')
    if (!r.ogImage) issues.push('no og:image')
    lines.push(`${key}: ${issues.length ? issues.join('; ') : 'ok'}`)
  }
  return lines
}
