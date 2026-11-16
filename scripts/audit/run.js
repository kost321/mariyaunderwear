/**
 * UX/UI audit of the running shop (see audit.md for the checklist and the report format).
 *
 *   npm run dev                         # in another terminal
 *   npm run audit                       # pages + scenarios, both widths
 *   npm run audit -- --only=crawl       # pages only (or --only=flows)
 *   npm run audit -- --pages=home,cart-empty
 *
 * Env: AUDIT_URL (default http://localhost:3000), AUDIT_IN_STOCK / AUDIT_SOLD_OUT (product slugs).
 * Output: screenshots in docs/audit/screenshots/<date>/, raw results in docs/audit/raw/<date>/,
 * a short digest in the terminal. The code is not changed and nothing is ordered or sent.
 * First run on a machine: `npx playwright install chromium`.
 */
import { BASE, findProducts, launch, serverIsUp, writeRaw } from './lib.js'
import { runCrawl, summarizeCrawl } from './crawl.js'
import { runFlows } from './flows.js'

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const only = arg('only')
const pages = arg('pages')?.split(',')

if (!(await serverIsUp())) {
  console.error(`${BASE} не відповідає. Запустіть сайт: npm run dev`)
  process.exit(1)
}

const products = await findProducts()
console.log('Test products:', products)

const browser = await launch()
try {
  if (only !== 'flows') {
    console.log('\nPages:')
    const crawl = await runCrawl(browser, products, pages)
    const file = writeRaw('crawl.json', crawl)
    console.log('\nDigest:\n' + summarizeCrawl(crawl).map((l) => '  ' + l).join('\n'))
    console.log(`Full results: ${file}`)
  }
  if (only !== 'crawl') {
    console.log('\nScenarios:')
    const flows = await runFlows(browser, products)
    console.log(`Full results: ${writeRaw('flows.json', flows)}`)
  }
} finally {
  await browser.close()
}
