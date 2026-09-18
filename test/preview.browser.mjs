import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'

// Opt-in browser regression; use an installed Playwright without bundling it.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
let browser
before(async () => {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
  })
})
after(async () => { await browser?.close() })

async function fixture({ seatTop = 548, layer = 7, width = 1000 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 700 } })
  await page.setContent(`<style>
    body { margin: 0; }
    #seat { position: fixed; top: ${seatTop}px; left: 12px; right: 12px;
      height: ${700 - seatTop}px; z-index: ${layer}; background: white; }
    #reply { margin: 80px 24px; }
  </style><div id="reply" data-dsh-message-role="assistant">需要查看的注释详情文本</div>
  <div id="seat" data-composer-card>输入框</div>`)
  await page.evaluate(() => {
    window.__ModuleLoader__ = { load({ factory }) {
      factory().apply({
        effect: callback => callback(),
        locale: { register: () => () => {}, bind: () => key => key, subscribe: () => () => {} },
        sessions: { list: { getSnapshot: () => ({ current: 'test-session' }), subscribe: () => () => {} } },
        conversation: { draftContexts: { register: () => () => {} } },
      })
    } }
  })
  await page.addScriptTag({ content: source })
  // Select via DOM so a high input card does not intercept test setup.
  await page.evaluate(() => {
    const range = document.createRange()
    range.selectNodeContents(document.querySelector('#reply'))
    getSelection().addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    document.querySelector('[data-dsh-add-to-chat-action] button').click()
  })
  await page.locator('[data-quote-pill]').hover()
  return page
}

async function previewState(page) {
  return page.locator('[data-quote-preview-list]').evaluate(element => {
    const rect = element.getBoundingClientRect()
    const pill = document.querySelector('[data-quote-pill]').getBoundingClientRect()
    return {
      hidden: element.hidden,
      text: element.textContent,
      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
      pillTop: pill.top, pillBottom: pill.bottom,
      hit: element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + 25)),
    }
  })
}

for (const layer of [7, 9]) {
  test(`reference preview opens above the input and remains interactive over layer ${layer}`, async () => {
    const page = await fixture({ layer })
    try {
      const state = await previewState(page)
      assert.equal(state.hidden, false)
      assert.match(state.text, /需要查看的注释详情文本/)
      assert.equal(state.hit, true, 'the preview must own hit testing, not the composer')
      assert.ok(state.bottom <= state.pillTop, 'prefer placement above the pill')
      await page.locator('[data-quote-preview-list] [data-quote-preview-remove]').click()
      assert.equal(await page.locator('[data-dsh-add-to-chat-rail]').isVisible(), false)
    } finally { await page.close() }
  })
}

test('insufficient space above falls back below without hiding under the composer', async () => {
  const page = await fixture({ seatTop: 60, layer: 9, width: 360 })
  try {
    const state = await previewState(page)
    assert.ok(state.top >= state.pillBottom)
    assert.equal(state.hit, true)
    assert.ok(state.left >= 12 && state.right <= 348)
    await page.locator('[data-quote-preview-list] [data-quote-preview-remove]').click()
    assert.equal(await page.locator('[data-dsh-add-to-chat-rail]').isVisible(), false)
  } finally { await page.close() }
})
