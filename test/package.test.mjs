import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('package declares one browser-only DSH client bundle', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(manifest.name, 'dsh-add-to-chat')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.deepEqual(manifest.dsh.bundle.patch, './cordis.patch.yml')
})

test('client source uses a valid data attribute for its action surface', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /action\.setAttribute\(`data-\$\{ACTION_ID\}`, ''\)/)
  assert.doesNotMatch(source, /action\.dataset\[ACTION_ID\]/)
})

test('client source submits plugin-owned draft context instead of touching the editor', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /ctx\.conversation\.draftContexts\.register\(source\)/)
  assert.match(source, /take: sessionId =>/)
  assert.match(source, /settle: \(sessionId, items, accepted\) =>/)
  assert.doesNotMatch(source, /input\.insertReference\(/)
  assert.doesNotMatch(source, /ctx\.inputTriggers\.registerSource\(source\)/)
  assert.doesNotMatch(source, /map\(line => `> \$\{line\}`\)/)
})

test('plugin metadata requests the conversation client without the obsolete input trigger', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-conversation'))
  assert.ok(!manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-input-trigger'))
})

test('client source recognizes only the semantic assistant reply marker', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /data-dsh-message-role="assistant"/)
  assert.match(source, /anchor === assistantReply\(selection\.focusNode\)/)
  assert.doesNotMatch(source, /data-time-hover-root/)
  assert.doesNotMatch(source, /\[class\*="bubble"\]/)
})

test('plugin keeps selected text in its own session-owned context list', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const sessionQuotes = new Map\(\)/)
  assert.match(source, /has: sessionId => quoteRefs\(sessionId\)\.length > 0/)
  assert.doesNotMatch(source, /dsh-add-to-chat-chip/)
})

test('reference preview uses numbered cards and keeps each reference removable', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /data-quote-preview-list/)
  assert.match(source, /content: counter\(dsh-add-to-chat-quote\) '\.'/)
  assert.match(source, /label\.textContent = '所选文本：'/)
  assert.match(source, /data-quote-preview-remove/)
  assert.match(source, /remove\.addEventListener\('click', \(\) => \{ removeQuote\(occurrence\.ref\) \}\)/)
})

test('failed prompt settlement restores selected text to its source list', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /if \(accepted \|\| items\.length === 0\) return/)
  assert.match(source, /sessionQuotes\.set\(sessionId, \[\.\.\.refs, \.\.\.quoteRefs\(sessionId\)\]\)/)
})

test('one quote owns one marker and accepted submission removes that marker', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const existing = markers\.get\(quote\.ref\)/)
  assert.match(source, /if \(existing !== undefined\) \{\s*positionMarker\(existing\)\s*return\s*\}/)
  assert.match(source, /for \(const quote of taken\) removeMarker\(quote\.ref\)/)
})

test('reference preview measures itself before placement and follows layout changes', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const previewBounds = preview\.getBoundingClientRect\(\)/)
  assert.match(source, /const above = bounds\.top - previewBounds\.height - gap/)
  assert.match(source, /window\.addEventListener\('resize', repositionPreview/)
  assert.match(source, /document\.addEventListener\('scroll', repositionPreview, true\)/)
})
