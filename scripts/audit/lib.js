// Shared setup for the UX/UI audit scripts (see run.js): browser, viewports, collectors, test products.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const BASE = (process.env.AUDIT_URL || 'http://localhost:3000').replace(/\/$/, '')

// Local date, so the folder matches the day of the run
const now = new Date()
export const DATE = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
export const SHOTS_DIR = path.join(ROOT, 'docs/audit/screenshots', DATE)
export const RAW_DIR = path.join(ROOT, 'docs/audit/raw', DATE)

export const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 } },
  390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}
export const WIDTHS = Object.keys(VIEWPORTS).map(Number).sort((a, b) => b - a)

export const launch = () => chromium.launch()

/** A fresh context (empty cart) and a page that records console errors, failed and slow requests. */
export async function open(browser, width) {
  const ctx = await browser.newContext({ ...VIEWPORTS[width], locale: 'uk-UA' })
  const page = await ctx.newPage()
  const log = { console: [], pageErrors: [], failed: [], slow: [] }
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) log.console.push(`${m.type()}: ${m.text().slice(0, 400)}`)
  })
  page.on('pageerror', (e) => log.pageErrors.push(String(e.message).slice(0, 400)))
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('__nextjs')) log.failed.push(`${r.status()} ${r.request().method()} ${r.url()}`)
  })
  page.on('requestfinished', (req) => {
    const ms = req.timing().responseEnd
    if (ms > 1500 && !/_next\/static|webpack|__nextjs/.test(req.url())) log.slow.push(`${Math.round(ms)}ms ${req.url()}`)
  })
  return { ctx, page, log }
}

/** Never let an audit place an order or send the cooperation form: the requests are aborted in the browser. */
export async function blockSubmissions(page, onBlocked = () => {}) {
  for (const url of ['**/api/order', '**/api/cooperation']) {
    await page.route(url, (route) => {
      onBlocked(url)
      route.abort()
    })
  }
}

/** Screenshot into docs/audit/screenshots/<date>/<name>-<width>.png; returns the path relative to docs/audit. */
export async function shot(page, name, width, fullPage = true) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
  const file = path.join(SHOTS_DIR, `${name}-${width}.png`)
  await page.screenshot({ path: file, fullPage })
  return path.relative(path.join(ROOT, 'docs/audit'), file)
}

export function writeRaw(name, data) {
  fs.mkdirSync(RAW_DIR, { recursive: true })
  const file = path.join(RAW_DIR, name)
  fs.writeFileSync(file, JSON.stringify(data, null, 1))
  return path.relative(ROOT, file)
}

export async function serverIsUp() {
  try {
    const res = await fetch(BASE + '/', { signal: AbortSignal.timeout(30000) })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Products to test with, picked from the shop's own API so the audit follows the data:
 * one with a size in stock (cart, checkout), one sold out with photos, one without photos.
 * AUDIT_IN_STOCK / AUDIT_SOLD_OUT (slugs) override the choice.
 */
export async function findProducts() {
  const res = await fetch(`${BASE}/api/products?limit=200&depth=0&where[active][equals]=true`)
  const docs = res.ok ? (await res.json()).docs : []
  const inStock = (p) => (p.sizes ?? []).some((s) => typeof s.stock === 'number' && s.stock > 0)
  const hasPhoto = (p) => (p.images ?? []).length > 0
  const slug = (p) => p?.slug ?? null
  return {
    inStock: process.env.AUDIT_IN_STOCK || slug(docs.find((p) => inStock(p) && hasPhoto(p)) ?? docs.find(inStock)),
    soldOut: process.env.AUDIT_SOLD_OUT || slug(docs.find((p) => !inStock(p) && hasPhoto(p)) ?? docs.find((p) => !inStock(p))),
    noPhoto: slug(docs.find((p) => !hasPhoto(p))),
  }
}

/** Runs a step and records a failure instead of stopping the whole audit. */
export function stepper(record) {
  return async (width, name, fn) => {
    try {
      await fn()
    } catch (e) {
      record(width, `${name} — FAILED`, e.message.split('\n')[0].slice(0, 300))
    }
  }
}
