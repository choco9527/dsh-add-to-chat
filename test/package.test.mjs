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

test('the quote lives in the composer as a reference chip the editor owns', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /ctx\.inputTriggers\.registerSource\(source\)/)
  assert.match(source, /input\.insertReference\(\{/)
  assert.match(source, /source: QUOTE_SOURCE/)
  // The chip is the only record of presence and order; a plugin-owned
  // parallel list would be a second source of truth the editor cannot see.
  assert.doesNotMatch(source, /const sessionQuotes = new Map\(\)/)
  assert.doesNotMatch(source, /ctx\.conversation\.draftContexts/)
  assert.doesNotMatch(source, /map\(line => `> \$\{line\}`\)/)
})

test('model text and clipboard text are produced by the reference codec', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /codec: \{/)
  assert.match(source, /clipboardText: ref => quotes\.get\(ref\)\?\.label \|\| ''/)
  assert.match(source, /serialize: async ref =>/)
  assert.match(source, /throw new Error\('assistant quote is no longer available'\)/)
})

test('plugin metadata requests the trigger pipeline that routes its chips', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-locale'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-conversation'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-input-trigger'))
})

test('client source recognizes only the semantic assistant reply marker', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /data-dsh-message-role="assistant"/)
  assert.match(source, /anchor === assistantReply\(selection\.focusNode\)/)
  assert.doesNotMatch(source, /data-time-hover-root/)
  assert.doesNotMatch(source, /\[class\*="bubble"\]/)
})

test('the rail projects the selected session composer rather than plugin state', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const occurrences = quoteOccurrences\(currentInput\(\)\)/)
  assert.match(source, /occurrence => occurrence\.source === QUOTE_SOURCE/)
  // Session-addressed on every read: a facade captured across a session
  // switch would edit and report on the wrong composer.
  assert.match(source, /ctx\.conversation\.input\.for\(scope\)/)
  assert.match(source, /if \(input === observedInput\) return/)
})

test('removing one reference deletes its single editor placeholder', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  // Occurrence offsets are clipboard coordinates; preceding chips collapse
  // back to one character each before the span is addressed.
  assert.match(source, /for \(const earlier of snapshot\.occurrences\.slice\(0, index\)\) start -= earlier\.length - 1/)
  assert.match(source, /input\.insertText\('', \{ start, end: start \+ 1, draftRev: snapshot\.draftRev \}\)/)
})

test('reference preview uses numbered cards and keeps each reference removable', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /data-quote-preview-list/)
  assert.match(source, /content: counter\(dsh-add-to-chat-quote\) '\.'/)
  assert.match(source, /label\.textContent = t\('selectedText'\)/)
  assert.match(source, /data-quote-preview-remove/)
  assert.match(source, /remove\.addEventListener\('click', \(\) => \{ removeQuote\(occurrence\.ref\) \}\)/)
})

test('client registers bilingual copy and refreshes existing controls on locale changes', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const zh = Object\.freeze\(/)
  assert.match(source, /const en = Object\.freeze\(/)
  assert.match(source, /ctx\.locale\.register\(LOCALE_NS, \{ zh, en \}\)/)
  assert.match(source, /ctx\.locale\.subscribe\(refreshLocalizedCopy\)/)
  assert.match(source, /button\.textContent = t\('add'\)/)
  assert.match(source, /return `\$\{t\('contextLabel'\)\}\\n\$\{quote\.text\}`/)
  assert.doesNotMatch(source, /button\.textContent = '添加到对话'/)
})

test('a refused insertion leaves no orphan quote behind', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  // A stale draft revision or an edit-refusing phase must not leave the quote
  // body in the map, or the codec would answer for a chip that never existed.
  assert.match(source, /if \(inserted !== true\) \{\s*quotes\.delete\(ref\)\s*return\s*\}/)
})

test('one quote owns one marker, reconciled from the live chip list', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const existing = markers\.get\(quote\.ref\)/)
  assert.match(source, /if \(existing !== undefined\) \{\s*positionMarker\(existing\)\s*return\s*\}/)
  assert.match(source, /if \(!occurrences\.some\(occurrence => occurrence\.ref === ref\)\) removeMarker\(ref\)/)
})

test('reference preview measures itself before placement and follows layout changes', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const previewBounds = preview\.getBoundingClientRect\(\)/)
  assert.match(source, /const above = bounds\.top - previewBounds\.height - gap/)
  assert.match(source, /window\.addEventListener\('resize', repositionPreview/)
  assert.match(source, /document\.addEventListener\('scroll', repositionPreview, true\)/)
})
