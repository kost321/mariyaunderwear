/**
 * Runs inside the page (page.evaluate): meta tags, horizontal overflow, tap targets, images, leftover
 * words, typography, control radii, line length, duplicated text, fields without labels.
 * Everything inside the Next.js dev overlay is ignored.
 */
export function pageChecks() {
  const out = {}
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0
  }
  const devOverlay = (el) => !!el.closest('nextjs-portal, [data-nextjs-toast], #__next-build-watcher')
  const describe = (el) => {
    const text = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('name') || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 50)
    const cls = (el.getAttribute('class') || '').split(' ').slice(0, 4).join('.')
    return `<${el.tagName.toLowerCase()}${cls ? ' .' + cls : ''}> "${text}"`
  }
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null

  out.title = document.title
  out.description = meta('meta[name="description"]')
  out.ogImage = meta('meta[property="og:image"]')
  out.canonical = document.querySelector('link[rel="canonical"]')?.href ?? null
  out.robots = meta('meta[name="robots"]')
  out.icons = [...document.querySelectorAll('link[rel*="icon"]')].map((l) => l.getAttribute('href'))
  out.h1 = [...document.querySelectorAll('h1')].map((h) => h.innerText.trim())

  // Horizontal overflow: elements past the viewport edge that no scrolling/clipping ancestor contains
  out.scrollWidth = document.documentElement.scrollWidth
  out.innerWidth = window.innerWidth
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') return true
    }
    return false
  }
  // Fixed off-canvas panels (the closed burger menu: inert or aria-hidden) are not overflow
  const offCanvas = (el) => !!el.closest('[aria-hidden="true"], [inert]')
  out.overflowing = [...document.querySelectorAll('body *')]
    .filter((el) => !devOverlay(el) && !offCanvas(el) && visible(el))
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.right > window.innerWidth + 1 || r.left < -1
    })
    .filter((el) => !clipped(el))
    .slice(0, 8)
    .map(describe)

  const interactive = [
    ...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch], summary'),
  ].filter((el) => !devOverlay(el) && visible(el))

  // Tap targets under 44px (only meaningful on the phone width)
  out.smallTargets = interactive
    .filter((el) => !offCanvas(el))
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { el: describe(el), w: Math.round(r.width), h: Math.round(r.height) }
    })
    .filter((t) => t.w < 44 || t.h < 44)

  out.images = [...document.querySelectorAll('img')]
    .filter((img) => !devOverlay(img) && img.getBoundingClientRect().width > 0)
    .map((img) => {
      const r = img.getBoundingClientRect()
      const src = img.currentSrc || img.src
      return {
        src: src.replace(location.origin, '').slice(0, 120),
        alt: img.getAttribute('alt'),
        nextImage: src.includes('/_next/image') || img.hasAttribute('data-nimg'),
        rendered: [Math.round(r.width), Math.round(r.height)],
        natural: [img.naturalWidth, img.naturalHeight],
      }
    })
  out.imagesWithoutAlt = out.images.filter((i) => i.alt === null).map((i) => i.src)
  out.imagesNotNext = out.images.filter((i) => !i.nextImage).map((i) => i.src)

  const text = document.body.innerText
  out.leftovers = [...new Set(text.match(/localhost|lorem|ipsum|TODO|FIXME|undefined|NaN|\bnull\b|\[object|\berror\b|Loading|Submit/gi) || [])]
  out.latinWords = [...new Set(text.match(/\b[A-Za-z][A-Za-z'’-]{2,}\b/g) || [])].slice(0, 60)

  // Typography: fonts of headings and text, caps and letter spacing
  const family = (el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()
  out.headingFonts = {}
  for (const h of document.querySelectorAll('h1, h2, h3, h4')) {
    if (!visible(h) || devOverlay(h)) continue
    const key = `${h.tagName} ${family(h)} ${getComputedStyle(h).fontSize}`
    out.headingFonts[key] = (out.headingFonts[key] || 0) + 1
  }
  out.caps = [...document.querySelectorAll('body *')]
    .filter((el) => !devOverlay(el) && visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((el) => {
      const s = getComputedStyle(el)
      return s.textTransform === 'uppercase' || (parseFloat(s.letterSpacing) || 0) > parseFloat(s.fontSize) * 0.05
    })
    .slice(0, 15)
    .map(describe)

  // Controls: radius per kind, dashed/dotted borders, sharp corners
  const boxed = (s) => s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderTopWidth) > 0
  out.radii = {}
  for (const el of interactive) {
    const s = getComputedStyle(el)
    if (!boxed(s)) continue
    const key = `${el.tagName.toLowerCase()}${el.type ? ':' + el.type : ''} r=${s.borderTopLeftRadius} h=${Math.round(el.getBoundingClientRect().height)}`
    out.radii[key] = out.radii[key] || describe(el)
  }
  out.dashed = [...document.querySelectorAll('body *')]
    .filter((el) => !devOverlay(el) && visible(el) && /dashed|dotted/.test(getComputedStyle(el).borderTopStyle))
    .slice(0, 5)
    .map(describe)
  out.sharpControls = interactive
    .filter((el) => {
      const s = getComputedStyle(el)
      return boxed(s) && parseFloat(s.borderTopLeftRadius) === 0 && el.getBoundingClientRect().width > 30
    })
    .slice(0, 8)
    .map(describe)

  // Characters per line of long text blocks (over ~80 is hard to read)
  const ctx = document.createElement('canvas').getContext('2d')
  const sample = 'Нічна сорочка з віскози, м’яка й легка, для щоденного носіння вдома та сну'
  out.longLines = [...document.querySelectorAll('p, li, dd')]
    .filter((el) => visible(el) && !devOverlay(el) && el.innerText.length > 150)
    .map((el) => {
      const s = getComputedStyle(el)
      ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
      const charWidth = ctx.measureText(sample).width / sample.length
      const width = el.getBoundingClientRect().width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
      return { el: describe(el), charsPerLine: Math.round(width / charWidth) }
    })
    .filter((x) => x.charsPerLine > 80)

  // The same sentence twice in the page body (a table of contents repeats headings on purpose)
  const seen = {}
  for (const el of document.querySelectorAll('main p, main h1, main h2, main h3, main li')) {
    if (!visible(el) || el.closest('nav')) continue
    const t = el.innerText.trim().replace(/\s+/g, ' ')
    if (t.length >= 40) seen[t] = (seen[t] || 0) + 1
  }
  out.duplicateText = Object.entries(seen)
    .filter(([, n]) => n > 1)
    .map(([t, n]) => `${n}× ${t.slice(0, 90)}`)

  out.fieldsWithoutLabel = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')]
    .filter((el) => visible(el) && !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
    .map(describe)
  out.controlsWithoutName = interactive
    .filter(
      (el) =>
        !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) &&
        !el.innerText.trim() &&
        !el.getAttribute('aria-label') &&
        !el.getAttribute('aria-labelledby') &&
        !el.getAttribute('title') &&
        !el.querySelector('img[alt]:not([alt=""])'),
    )
    .map(describe)

  return out
}
