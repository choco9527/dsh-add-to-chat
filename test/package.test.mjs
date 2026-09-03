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

test('client source inserts structured references instead of Markdown quotes', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /input\.insertReference\(/)
  assert.match(source, /input\?\.removeReference\?\./)
  assert.match(source, /removeReferenceWithTextEdit\(input, occurrence\)/)
  assert.match(source, /input\.insertText\?\.\('', \{ start, end: start \+ 1, draftRev: snapshot\.draftRev \}\)/)
  assert.match(source, /ctx\.inputTriggers\.registerSource\(source\)/)
  assert.doesNotMatch(source, /map\(line => `> \$\{line\}`\)/)
})

test('plugin metadata loads the reference serializer before this client', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-input-trigger'))
})

test('client source recognizes only the semantic assistant reply marker', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /data-dsh-message-role="assistant"/)
  assert.match(source, /anchor === assistantReply\(selection\.focusNode\)/)
  assert.doesNotMatch(source, /data-time-hover-root/)
  assert.doesNotMatch(source, /\[class\*="bubble"\]/)
})

test('plugin decorates only its own inserted reference chips', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(source, /const CHIP_ID = 'dsh-add-to-chat-chip'/)
  assert.match(source, /chip\.setAttribute\(`data-\$\{CHIP_ID\}`, ''\)/)
})
