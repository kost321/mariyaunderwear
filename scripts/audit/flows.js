/**
 * Scenario pass: keyboard, home hero, catalog filters and search, header search, mobile menu,
 * product page (size chart, accordions, quick order, lightbox), cart and the three checkout steps,
 * cooperation form validation. Orders and the cooperation form are never sent (blockSubmissions).
 * Each step writes notes ("what happened"); judging them is left to the person reading the report.
 */
import { BASE, WIDTHS, blockSubmissions, open, shot, stepper } from './lib.js'

/** What has the keyboard focus: name, whether it is on screen, inside aria-hidden, and its focus ring */
const focusInfo = (page) =>
  page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return 'body'
    const r = el.getBoundingClientRect()
    let opacity = 1
    for (let p = el; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity)
    const onScreen = r.width > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && opacity > 0.05
    const s = getComputedStyle(el)
    const ring = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? 'ring' : s.boxShadow !== 'none' ? 'shadow' : 'NO RING'
    const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 30)
    return `${el.tagName.toLowerCase()} "${name}"${onScreen ? '' : ' OFFSCREEN'}${el.closest('[aria-hidden="true"]') ? ' IN-ARIA-HIDDEN' : ''} ${ring}`
  })

const tabSequence = async (page, n) => {
  const seq = []
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab')
    seq.push(await focusInfo(page))
  }
  return seq
}

/** Native validation messages of the fields in a form (empty when valid) */
const validity = (page, selector) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)].map(
        (i) => `${(i.labels?.[0]?.innerText || i.name || '?').replace(/\s+/g, ' ')}: ${i.validationMessage || 'ok'}`,
      ),
    selector,
  )

const currentStep = (page) =>
  page.locator('nav[aria-label="Кроки оформлення"] [aria-current=step]').innerText().then((t) => t.replace(/\s+/g, ' '))

export async function runFlows(browser, products) {
  const notes = []
  const note = (width, step, data) => {
    notes.push({ width, step, data })
    console.log(`  [${width}] ${step}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  const step = stepper(note)
  const blocked = (width) => (url) => note(width, 'BLOCKED submission', url)

  for (const w of WIDTHS) {
    await step(w, 'keyboard', async () => {
      const { ctx, page } = await open(browser, w)
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      note(w, 'Tab from the top of the home page', await tabSequence(page, 16))
      await ctx.close()
    })

    await step(w, 'home hero', async () => {
      const { ctx, page } = await open(browser, w)
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const hero = page.locator('main section').first()
      const shownPhoto = () =>
        hero.locator('img').evaluateAll((imgs) =>
          imgs.filter((i) => i.getBoundingClientRect().width > 100 && getComputedStyle(i).opacity !== '0').map((i) => i.alt.slice(0, 60)),
        )
      const swatches = hero.locator('button[aria-pressed]')
      note(w, 'hero swatches', await swatches.evaluateAll((b) => b.map((x) => `${x.getAttribute('aria-label')}${x.getAttribute('aria-pressed') === 'true' ? ' (on)' : ''}`)))
      const before = await shownPhoto()
      const another = hero.locator('button[aria-pressed="false"]').first()
      if (await another.count()) {
        await another.click()
        await page.waitForTimeout(800)
        const after = await shownPhoto()
        note(w, 'hero photo changes with the swatch', JSON.stringify(before) !== JSON.stringify(after))
      }
      await shot(page, 'flow-home-hero', w, false)
      await ctx.close()
    })

    await step(w, 'catalog', async () => {
      const { ctx, page } = await open(browser, w)
      await page.goto(BASE + '/catalog', { waitUntil: 'networkidle' })
      const count = () => page.locator('main .mb-6 p').first().innerText()
      const emptyTitle = () => page.locator('main p.font-serif').first().innerText().catch(() => '(no empty state)')
      note(w, 'products', await count())
      if (w < 1000) {
        await page.getByRole('button', { name: /Фільтри/ }).click()
        await page.waitForTimeout(300)
        await shot(page, 'flow-catalog-filters-open', w)
      }
      await page.getByRole('switch').click()
      await page.waitForURL(/stock=in/)
      await page.waitForLoadState('networkidle')
      note(w, '«Тільки в наявності»', `${await count()} (${page.url().replace(BASE, '')})`)
      const firstSize = page.locator('#catalog-filters button[aria-pressed]').first()
      const sizeLabel = await firstSize.innerText()
      await firstSize.click()
      await page.waitForURL(/size=/)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)
      note(w, `+ size ${sizeLabel}`, `${await count()} | empty state: ${await emptyTitle()}`)
      await shot(page, 'flow-catalog-filtered', w)
      const reset = page.getByRole('button', { name: 'Скинути фільтри' })
      if (await reset.count()) {
        await reset.first().click()
        await page.waitForURL((u) => !u.search.includes('size'))
        note(w, '«Скинути фільтри» →', page.url().replace(BASE, ''))
      }
      await page.locator('main select').selectOption('price-desc')
      await page.waitForURL(/sort=price-desc/)
      note(w, 'sort →', page.url().replace(BASE, ''))
      const search = page.locator('#catalog-search')
      await search.fill('сорочка')
      await page.waitForURL(/q=/, { timeout: 5000 })
      await page.waitForLoadState('networkidle')
      note(w, 'search «сорочка»', await count())
      await search.fill('щоакуцк')
      await page.waitForURL(/q=%D1%89/, { timeout: 5000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)
      note(w, 'search nonsense', await emptyTitle())
      await shot(page, 'flow-catalog-search-empty', w)
      await ctx.close()
    })

    await step(w, 'header search', async () => {
      const { ctx, page } = await open(browser, w)
      await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Пошук', exact: true }).click()
      await page.waitForTimeout(400)
      note(w, 'focus after opening', await focusInfo(page))
      await page.keyboard.type('сорочка', { delay: 50 })
      // Results come from /api/search after a pause; the first request in dev also compiles the route
      await page.locator('#header-search a').first().waitFor({ timeout: 15000 }).catch(() => {})
      note(w, 'results', (await page.locator('#header-search').innerText()).replace(/\s+/g, ' ').slice(0, 200))
      await shot(page, 'flow-header-search', w, false)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      note(w, 'closed by Esc', (await page.locator('#header-search').count()) === 0)
      await ctx.close()
    })

    if (w < 1000)
      await step(w, 'mobile menu', async () => {
        const { ctx, page } = await open(browser, w)
        await page.goto(BASE + '/', { waitUntil: 'networkidle' })
        await page.getByRole('button', { name: 'Відкрити меню' }).click()
        await page.waitForTimeout(400)
        await shot(page, 'flow-mobile-menu', w, false)
        note(w, 'menu: focus after opening', await focusInfo(page))
        note(w, 'menu: page scroll locked', (await page.evaluate(() => document.body.style.overflow)) === 'hidden')
        note(w, 'menu: Tab', await tabSequence(page, 10))
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
        note(w, 'menu: closed by Esc', (await page.locator('aside[aria-label="Меню"]').evaluate((e) => getComputedStyle(e.parentElement).opacity)) === '0')
        await ctx.close()
      })

    if (products.soldOut)
      await step(w, 'sold-out product', async () => {
        const { ctx, page } = await open(browser, w)
        await page.goto(`${BASE}/product/${products.soldOut}`, { waitUntil: 'networkidle' })
        note(w, 'buttons', await page.locator('main button:visible').evaluateAll((b) => b.map((x) => `${x.innerText.trim() || x.getAttribute('aria-label')}${x.disabled ? ' [disabled]' : ''}`)))
        note(w, 'sticky buy bar', await page.locator('[data-sticky-buy]').count())
        note(w, 'hint', await page.locator('main p', { hasText: 'закінчився' }).innerText().catch(() => '(none)'))
        const opener = w >= 1000 ? page.getByRole('button', { name: 'Збільшити фото' }) : page.getByRole('button', { name: /Фото 1 з/ })
        if (await opener.count()) {
          await opener.click()
          await page.waitForTimeout(500)
          note(w, 'lightbox: focus after opening', await focusInfo(page))
          await shot(page, 'flow-lightbox', w, false)
          await page.keyboard.press('Escape')
          await page.waitForTimeout(400)
          note(w, 'lightbox: closed by Esc', (await page.locator('[role=dialog]:not([aria-label="Меню"])').count()) === 0)
        }
        await ctx.close()
      })

    if (!products.inStock) {
      note(w, 'cart and checkout', 'SKIPPED: no product with a size in stock')
    } else {
      await step(w, 'product → cart → checkout', async () => {
        const { ctx, page, log } = await open(browser, w)
        await blockSubmissions(page, blocked(w))
        await page.goto(`${BASE}/product/${products.inStock}`, { waitUntil: 'networkidle' })
        note(w, 'preselected size', await page.locator('main button[aria-pressed="true"]').allInnerTexts())

        // Add without a size (only possible when several sizes are in stock), then pick the first one in stock
        const add = page.getByRole('button', { name: /Додати в кошик/ }).locator('visible=true').first()
        if ((await page.locator('main button[aria-pressed="true"]').count()) === 0) {
          await add.click()
          await page.waitForTimeout(300)
          note(w, 'add without a size', await page.locator('main [role=alert]').allInnerTexts())
          const firstSize = page.locator('main button[aria-pressed="false"]:not([disabled])').first()
          note(w, 'picked size', await firstSize.innerText())
          await firstSize.click()
        }
        const plus = page.getByRole('button', { name: 'Збільшити кількість' }).first()
        let qty = 1
        while (!(await plus.isDisabled()) && qty < 10) {
          await plus.click()
          qty++
        }
        note(w, 'quantity stops at', `${qty} (stock of the size)`)
        for (let i = 1; i < qty; i++) await page.getByRole('button', { name: 'Зменшити кількість' }).first().click()

        const chart = page.getByRole('button', { name: 'Розмірна таблиця' })
        if (await chart.count()) {
          await chart.click()
          await page.waitForTimeout(400)
          note(w, 'size chart: focus after opening', await focusInfo(page))
          note(w, 'size chart: page scroll locked', (await page.evaluate(() => document.body.style.overflow)) === 'hidden')
          await shot(page, 'flow-size-chart', w, false)
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)
          note(w, 'size chart: closed by Esc', (await page.locator('#size-chart-title').count()) === 0)
        }
        for (const title of ['Догляд', 'Доставка й оплата', 'Обмін і повернення']) {
          const b = page.getByRole('button', { name: title, exact: true })
          if (!(await b.count())) continue
          await b.click()
          await page.waitForTimeout(150)
          note(w, `accordion «${title}»`, (await page.locator(`#buy-info-${title.replace(/\s+/g, '-')}`).innerText().catch(() => '(not opened)')).replace(/\s+/g, ' ').slice(0, 200))
        }

        const quick = page.getByRole('button', { name: 'Купити в 1 клік' })
        if (await quick.count()) {
          await quick.click()
          await page.waitForTimeout(400)
          note(w, 'quick order: focus after opening', await focusInfo(page))
          await page.getByRole('button', { name: 'Замовити' }).click()
          await page.waitForTimeout(200)
          note(w, 'quick order: empty submit', await validity(page, '[role=dialog] input'))
          await page.locator('[role=dialog] input[autocomplete=name]').fill('Maria')
          await page.locator('[role=dialog] input[type=tel]').fill('67123')
          await page.getByRole('button', { name: 'Замовити' }).click()
          await page.waitForTimeout(200)
          note(w, 'quick order: short phone', await page.locator('[role=dialog] [role=alert]').allInnerTexts())
          await shot(page, 'flow-quick-order', w, false)
          note(w, 'quick order: Tab stays inside?', await tabSequence(page, 6))
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)
          note(w, 'quick order: closed by Esc', (await page.locator('#quick-order-title').count()) === 0)
        }

        await add.click()
        await page.waitForTimeout(300)
        note(w, 'after «Додати в кошик»', await page.locator('main button:visible, [data-sticky-buy] button:visible').filter({ hasText: /Додано|Уже в кошику|Додати/ }).first().innerText())
        note(w, 'cart icon', await page.locator('header a[href="/cart"]').getAttribute('aria-label'))
        note(w, 'quantity «+» disabled at stock', await page.getByRole('button', { name: 'Збільшити кількість' }).first().isDisabled())

        // Cart
        await page.goto(BASE + '/cart', { waitUntil: 'networkidle' })
        await page.waitForTimeout(800)
        await shot(page, 'flow-cart', w)
        note(w, 'cart lines', (await page.locator('section[aria-label="Товари в кошику"] li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ')))
        await page.getByRole('button', { name: /Прибрати з кошика/ }).first().click()
        await page.waitForTimeout(300)
        note(w, 'after removing', `${await page.locator('main h1').innerText()} | toast: ${(await page.locator('[role=status]').innerText().catch(() => 'none')).replace(/\s+/g, ' ')}`)
        await shot(page, 'flow-cart-undo-toast', w, false)
        await page.getByRole('button', { name: 'Повернути' }).click()
        await page.waitForTimeout(300)
        note(w, 'after «Повернути»', await page.locator('main h1').innerText())
        await page.getByRole('button', { name: 'Оформити замовлення' }).click()
        await page.waitForTimeout(200)
        note(w, 'without the offer consent', await page.locator('#consent-error').innerText().catch(() => '(no message)'))
        await page.locator('main input[type=checkbox]').check()
        await page.getByRole('button', { name: 'Оформити замовлення' }).click()
        await page.waitForTimeout(400)

        // Checkout: «Інформація»
        const phone = page.locator('main input[type=tel]')
        const email = page.locator('main input[name=email]')
        const toShipping = page.getByRole('button', { name: /Доставка/ }).last()
        await toShipping.click()
        await page.waitForTimeout(200)
        note(w, 'info: empty submit', await validity(page, 'main form input'))
        await shot(page, 'flow-checkout-info-empty', w, false)
        await page.getByLabel(/Імʼя/).fill('Марія')
        await page.getByLabel(/Прізвище/).fill('Іваненко')
        await toShipping.click()
        await page.waitForTimeout(200)
        note(w, 'info: names filled, phone empty', await page.locator('main [role=alert]').allInnerTexts())
        await phone.fill('+48 512 345 678')
        note(w, 'phone: typed «+48 512 345 678» →', await phone.inputValue())
        await phone.fill('671234567')
        await email.fill('bad-email')
        await page.getByLabel(/Імʼя/).fill('Maria')
        await page.getByLabel(/Прізвище/).fill('Ivanova')
        await page.getByLabel(/Прізвище/).blur()
        await page.waitForTimeout(150)
        note(w, 'Latin name hint', await page.locator('main p[aria-live=polite]').innerText())
        await toShipping.click()
        await page.waitForTimeout(200)
        note(w, 'bad email', await email.evaluate((i) => i.validationMessage || 'accepted'))
        await email.fill('')
        await toShipping.click()
        await page.waitForTimeout(300)
        note(w, 'step', await currentStep(page))

        // «Доставка»
        const toPayment = page.getByRole('button', { name: /Оплата/ }).last()
        await toPayment.click()
        await page.waitForTimeout(200)
        note(w, 'shipping: empty submit', await validity(page, 'main form input'))
        await shot(page, 'flow-checkout-shipping', w)
        await page.getByLabel(/Місто/).fill('Київ')
        await page.getByLabel(/відділення/).fill('abc')
        await toPayment.click()
        await page.waitForTimeout(300)
        note(w, 'branch «abc» → step', await currentStep(page))

        // «Оплата»: checked, never submitted
        await shot(page, 'flow-checkout-payment', w)
        note(w, 'review', (await page.locator('main section dl').first().innerText()).replace(/\n+/g, ' | '))
        note(w, 'payment method preselected', (await page.locator('input[name=paymentMethod]:checked').count()) > 0)
        note(w, 'payment form without a method', await page.getByRole('button', { name: 'Підтвердити замовлення' }).evaluate((b) => (b.form.checkValidity() ? 'valid' : 'blocked by the browser')))
        await page.getByRole('button', { name: 'Змінити' }).first().click()
        await page.waitForTimeout(200)
        note(w, '«Змінити» → step', `${await currentStep(page)}, name kept: ${await page.getByLabel(/Імʼя/).inputValue()}`)
        await page.getByRole('button', { name: /Оплата/ }).first().click()
        await page.waitForTimeout(200)
        note(w, 'step tab «Оплата» → step', await currentStep(page))
        await page.goBack()
        await page.waitForTimeout(1000)
        note(w, 'browser Back from checkout →', `${page.url().replace(BASE, '')} | h1: ${await page.locator('main h1').innerText().catch(() => '?')}`)
        note(w, 'console', log.console.concat(log.pageErrors))
        await ctx.close()
      })
    }

    await step(w, 'cooperation', async () => {
      const { ctx, page } = await open(browser, w)
      await blockSubmissions(page, blocked(w))
      await page.goto(BASE + '/cooperation', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: /Надіслати/ }).click()
      await page.waitForTimeout(200)
      note(w, 'empty submit', await validity(page, 'main form input, main form textarea'))
      await shot(page, 'flow-cooperation-errors', w)
      await ctx.close()
    })
  }
  return notes
}
