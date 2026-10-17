// popoff in a real browser: npm test, in Chromium, Firefox and WebKit (BROWSER=firefox node --test test/test.js for one).
// The fixture (test/fixture.html) has a control of each kind
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as engines from 'playwright'
import { parse } from '../popoff.js'

const root = fileURLToPath(new URL('..', import.meta.url))
let server, browser, page, origin
before(async () => {
  server = createServer(async (req, res) => {
    const body = await readFile(join(root, req.url.split('?')[0])).catch(() => null)
    if (!body) return res.writeHead(404).end()
    res.writeHead(200, { 'content-type': extname(req.url) === '.js' ? 'text/javascript' : 'text/html' }).end(body)
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await engines[process.env.BROWSER ?? 'chromium'].launch()
})
after(async () => { await browser?.close(); server?.close() })
const fresh = async () => {
  page = await browser.newPage({ viewport: { width: 800, height: 600 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin + '/test/fixture.html')
  await page.waitForFunction(() => window.stop)
  return errors
}
const tip = () => page.locator('.popoff-tip')
// how long after the pointer came onto `id` the tooltip opened, ms, measured in the page
const waited = id => page.evaluate(id => new Promise(done => {
  let came = 0
  document.getElementById(id).addEventListener('pointerover', () => came ||= performance.now(), { once: true })
  addEventListener('toggle', e => { if (e.target.matches('.popoff-tip') && e.newState === 'open' && came) done(performance.now() - came) }, true)
}), id)

test('parse: a title is a name, its keys and what it does', () => {
  assert.deepEqual(parse('Undo (⌘Z)'), { name: 'Undo', keys: '⌘Z', body: '' })
  assert.deepEqual(parse('Undo (Ctrl+Shift+Z)'), { name: 'Undo', keys: 'Ctrl+Shift+Z', body: '' })
  assert.deepEqual(parse('Play (Space)\nhold and drag to rewind'), { name: 'Play', keys: 'Space', body: 'Hold and drag to rewind' })
  assert.deepEqual(parse('Opening the microphone: click to cancel'), { name: 'Opening the microphone', keys: '', body: 'Click to cancel' })
  assert.deepEqual(parse('Hear the original: level-matched (B)'), { name: 'Hear the original', keys: 'B', body: 'Level-matched' })
  assert.deepEqual(parse('Caret (the settings)'), { name: 'Caret (the settings)', keys: '', body: '' }, 'words in brackets are no keys')
  assert.deepEqual(parse('Selected 0:02.000–0:03.000: 44100 samples'), { name: 'Selected 0:02.000–0:03.000', keys: '', body: '44100 samples' }, 'a time\'s colons are no break')
})

test('tooltip: after the delay, its parts, its tip at the control; the title back once left', async () => {
  const errors = await fresh()
  const play = page.locator('#play'), wait = waited('play')
  await play.hover()
  assert.equal(await play.getAttribute('title'), null, 'no browser tooltip meanwhile')
  assert.ok(await wait >= 290, 'after the delay')
  await tip().waitFor()
  assert.equal(await tip().locator('.popoff-tip-name').innerText(), 'Play')
  assert.equal(await tip().locator('.popoff-tip-keys').innerText(), 'Space')
  assert.equal(await tip().locator('.popoff-tip-body').innerText(), 'Hold and drag to rewind')
  assert.equal(await tip().getAttribute('data-side'), 'bottom')
  const [p, t, arrow] = [await play.boundingBox(), await tip().boundingBox(), await tip().evaluate(el => parseFloat(el.style.getPropertyValue('--popoff-arrow')))]
  assert.ok(Math.abs(t.x + arrow - (p.x + p.width / 2)) <= 1, 'its tip at the middle of the control')
  await page.mouse.move(700, 300)
  await tip().waitFor({ state: 'hidden' })
  assert.match(await play.getAttribute('title'), /^Play \(Space\)/)
  assert.deepEqual(errors, [])
})

test('tooltip: the next waits as the first did; none across a toolbar passed over', async () => {
  await fresh()
  await page.locator('#undo').hover()
  await tip().waitFor()
  const wait = waited('redo')
  await page.locator('#redo').hover()
  assert.ok(await wait >= 290, 'not at once')
  assert.equal(await tip().locator('.popoff-tip-name').innerText(), 'Redo')
  // crossed quickly: none
  await page.mouse.move(700, 300)
  for (const id of ['#undo', '#redo', '#play']) { await page.locator(id).hover(); await page.waitForTimeout(60) }
  await page.mouse.move(700, 300)
  await page.waitForTimeout(400)
  assert.ok(!await tip().isVisible())
})

test('tooltip: at the window\'s foot, over the control; a press hides it till the pointer leaves', async () => {
  await fresh()
  await page.locator('#foot').hover()
  await tip().waitFor()
  assert.equal(await tip().getAttribute('data-side'), 'top')
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(450)
  assert.ok(!await tip().isVisible(), 'pressed, none')
})

test('tooltip: none for a control whose popover is open; a row of its menu, beside the menu', async () => {
  await fresh()
  await page.locator('#opener').click()
  await page.locator('#menu:popover-open').waitFor()
  await page.mouse.move(700, 300)
  await page.locator('#opener').hover()
  await page.waitForTimeout(450)
  assert.ok(!await tip().isVisible(), 'none while its menu is open')
  await page.locator('#row').hover()
  await tip().waitFor()
  assert.equal(await tip().getAttribute('data-side'), 'right')
  const [menu, t] = [await page.locator('#menu').boundingBox(), await tip().boundingBox()]
  assert.ok(t.x >= menu.x + menu.width, 'past the menu')
})

test('placed popover: under its opener, its start at the opener\'s, by CSS anchor positioning', async () => {
  await fresh()
  await page.locator('#opener').click()
  const [o, m] = [await page.locator('#opener').boundingBox(), await page.locator('#menu').boundingBox()]
  assert.ok(Math.abs(m.x - o.x) <= 1, `lined up: ${m.x} ${o.x}`)
  assert.ok(m.y >= o.y + o.height, 'under it')
  assert.equal(await page.locator('#menu').evaluate(el => getComputedStyle(el).positionArea.split(' ').sort().join(' ')), 'bottom span-right', 'said as CSS')
})

test('placed popover, no anchor positioning: measured, flipped where there is no room', async () => {
  await fresh()
  const side = await page.evaluate(async () => {
    const { place } = await import('../popoff.js')
    const el = document.querySelector('#menu'), foot = document.querySelector('#foot')
    el.showPopover()
    return place(el, foot, { side: 'bottom', align: 'start' })
  })
  assert.equal(side, 'top')
  const [f, m] = [await page.locator('#foot').boundingBox(), await page.locator('#menu').boundingBox()]
  assert.ok(m.y + m.height <= f.y, 'over it')
})

test('hover card: shown after the delay, kept while the pointer is on it, gone once left', async () => {
  await fresh()
  await page.locator('#hover').hover()
  await page.locator('#card:popover-open').waitFor()
  await page.locator('#card').hover()
  await page.waitForTimeout(450)
  assert.ok(await page.locator('#card').isVisible(), 'kept')
  await page.mouse.move(700, 500)
  await page.locator('#card:popover-open').waitFor({ state: 'detached' })
})

test('modal: a press on its backdrop closes it (closedby="any")', async () => {
  await fresh()
  await page.locator('#modal').click()
  assert.ok(await page.locator('#dlg').evaluate(d => d.open))
  await page.mouse.click(5, 5)
  await page.waitForFunction(() => !document.querySelector('#dlg').open)
})

test('stop: no tooltips after, the titles left as they were', async () => {
  await fresh()
  await page.evaluate(() => window.stop())
  await page.locator('#play').hover()
  await page.waitForTimeout(450)
  assert.equal(await page.locator('.popoff-tip').count(), 0)
  assert.match(await page.locator('#play').getAttribute('title'), /^Play/)
})
