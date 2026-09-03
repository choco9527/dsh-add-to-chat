// Browser half of dsh-add-to-chat. It uses public browser services only, so
// the package remains an independently installable client plugin.
window.__ModuleLoader__.load({
  id: 'dsh-add-to-chat',
  factory: () => {
    'use strict'

    const STYLE_ID = 'dsh-add-to-chat-style'
    const ACTION_ID = 'dsh-add-to-chat-action'
    const RAIL_ID = 'dsh-add-to-chat-rail'
    const PREVIEW_ID = 'dsh-add-to-chat-preview'
    const MARKER_ID = 'dsh-add-to-chat-marker'
    const QUOTE_SOURCE = 'dsh-add-to-chat-assistant-quote'
    const ASSISTANT_REPLY_SELECTOR = '[data-dsh-message-role="assistant"]'
    const QUOTE_LABEL = '引用助手回复：'
    const CARD_SELECTOR = '[data-composer-card]'

    function installStyle() {
      if (document.getElementById(STYLE_ID)) return
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = [
        `[data-${ACTION_ID}], [data-${RAIL_ID}], [data-${PREVIEW_ID}], [data-${MARKER_ID}] { position: fixed; z-index: 1200; }`,
        `[data-${ACTION_ID}][hidden], [data-${RAIL_ID}][hidden], [data-${PREVIEW_ID}][hidden], [data-${MARKER_ID}][hidden] { display: none !important; }`,
        `[data-${ACTION_ID}] { display: inline-flex; transform: translate(-50%, -100%); }`,
        `[data-${ACTION_ID}][data-placement="below"] { transform: translateX(-50%); }`,
        `[data-${ACTION_ID}] button, [data-${RAIL_ID}] [data-quote-pill] { position: relative; overflow: hidden; border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #000) 34%, transparent); border-radius: 28px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 48%, transparent); box-shadow: 0 8px 24px rgb(15 23 42 / 10%); color: var(--dsw-alias-label-primary, #17191c); font: inherit; backdrop-filter: blur(2px) saturate(1.12); -webkit-backdrop-filter: blur(2px) saturate(1.12); }`,
        `[data-${ACTION_ID}] button::before, [data-${RAIL_ID}] [data-quote-pill]::before { content: ''; position: absolute; inset: 1px 1px auto; height: 42%; border-radius: inherit; background: linear-gradient(180deg, rgb(255 255 255 / 34%), transparent); pointer-events: none; }`,
        `[data-${ACTION_ID}] button { height: 32px; padding: 0 13px; cursor: pointer; font-size: 13px; }`,
        `[data-${ACTION_ID}] button:hover, [data-${ACTION_ID}] button:focus-visible { background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 42%, transparent); }`,
        `[data-${RAIL_ID}] { display: flex; align-items: center; gap: 4px; }`,
        `[data-${RAIL_ID}] [data-quote-pill] { height: 30px; padding: 0 11px; cursor: pointer; font-size: 13px; }`,
        `[data-${RAIL_ID}] [data-quote-remove-all] { width: 30px; height: 30px; border: 0; border-radius: 50%; cursor: pointer; background: transparent; color: var(--dsw-alias-label-primary, #17191c); font: 18px/1 system-ui, sans-serif; }`,
        `[data-${PREVIEW_ID}] { width: min(360px, calc(100vw - 24px)); padding: 10px; border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 12%)); border-radius: 14px; background: var(--dsw-alias-bg-layer-1, #fff); box-shadow: 0 14px 36px rgb(15 23 42 / 16%); color: var(--dsw-alias-label-primary, #17191c); font: 13px/1.5 system-ui, sans-serif; }`,
        `[data-${PREVIEW_ID}] [data-quote-preview-item] { display: flex; align-items: flex-start; gap: 8px; }`,
        `[data-${PREVIEW_ID}] [data-quote-preview-text] { flex: 1; max-height: 120px; overflow: auto; white-space: pre-wrap; }`,
        `[data-${PREVIEW_ID}] button { flex: none; width: 22px; height: 22px; border: 0; border-radius: 50%; cursor: pointer; background: transparent; color: inherit; font-size: 16px; }`,
        `[data-${MARKER_ID}] { display: grid; width: 22px; height: 22px; place-items: center; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #1677ff) 28%, transparent); border-radius: 50%; background: var(--dsw-alias-bg-layer-1, #fff); color: var(--dsw-alias-state-business-primary, #1677ff); box-shadow: 0 4px 12px rgb(15 23 42 / 14%); cursor: pointer; font: 11px/1 system-ui, sans-serif; }`,
        `@supports not (backdrop-filter: blur(3px)) { [data-${ACTION_ID}] button, [data-${RAIL_ID}] [data-quote-pill] { background: var(--dsw-alias-bg-layer-1, #fff); } }`,
        `@supports (anchor-name: --dsh-add-to-chat-anchor) { [data-${PREVIEW_ID}][data-anchored] { top: anchor(bottom); left: anchor(center); transform: translate(-50%, 8px); position-try-fallbacks: flip-block, flip-inline; } }`,
      ].join('\n')
      document.head.appendChild(style)
    }

    function assistantReply(node) {
      const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement
      return element?.closest(ASSISTANT_REPLY_SELECTOR)
    }

    function isAssistantSelection(selection) {
      const anchor = assistantReply(selection.anchorNode)
      return anchor !== undefined && anchor !== null && anchor === assistantReply(selection.focusNode)
    }

    function compactLabel(text) {
      const firstLine = text.trim().replace(/\s+/gu, ' ').slice(0, 28)
      return firstLine === '' ? '助手引用' : `引用：${firstLine}`
    }

    function detectEnd(snapshot) {
      return snapshot.draft.length - snapshot.occurrences.reduce(
        (size, occurrence) => size + occurrence.length - 1,
        0,
      )
    }

    function referenceId() {
      return globalThis.crypto?.randomUUID?.() || `quote-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    function apply(ctx) {
      installStyle()
      const action = document.createElement('div')
      action.setAttribute(`data-${ACTION_ID}`, '')
      action.hidden = true
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = '添加到对话'
      action.appendChild(button)
      document.body.appendChild(action)

      const rail = document.createElement('div')
      rail.setAttribute(`data-${RAIL_ID}`, '')
      rail.hidden = true
      document.body.appendChild(rail)

      const preview = document.createElement('div')
      preview.setAttribute(`data-${PREVIEW_ID}`, '')
      preview.hidden = true
      document.body.appendChild(preview)

      let selectedText = ''
      let selectedRange = null
      let observedInput = null
      let inputOff = null
      let previewTimer = null
      const quotes = new Map()
      const markers = new Map()

      function hideAction() {
        action.hidden = true
        selectedText = ''
        selectedRange = null
      }

      function updateAction() {
        const selection = window.getSelection()
        const text = selection?.toString().trim() || ''
        if (!selection || !text || !isAssistantSelection(selection) || selection.rangeCount === 0) {
          hideAction()
          return
        }
        const bounds = selection.getRangeAt(0).getBoundingClientRect()
        if (bounds.width === 0 && bounds.height === 0) {
          hideAction()
          return
        }
        selectedText = text
        selectedRange = selection.getRangeAt(0).cloneRange()
        const left = Math.max(68, Math.min(bounds.left + bounds.width / 2, window.innerWidth - 68))
        const above = bounds.top - 8
        action.style.left = `${left}px`
        action.style.top = `${above >= 44 ? above : bounds.bottom + 8}px`
        action.setAttribute('data-placement', above >= 44 ? 'above' : 'below')
        action.hidden = false
      }

      function currentInput() {
        const sessionId = ctx.sessions.list.getSnapshot().current
        const scope = sessionId === undefined ? undefined : ctx.sessions.scope(sessionId)
        return scope === undefined ? undefined : ctx.conversation.input.for(scope)
      }

      function positionPreview(anchor) {
        const bounds = anchor.getBoundingClientRect()
        preview.style.left = `${Math.max(12, Math.min(bounds.left + bounds.width / 2, window.innerWidth - 12))}px`
        preview.style.top = `${Math.min(window.innerHeight - 12, bounds.bottom + 8)}px`
        preview.style.transform = 'translateX(-50%)'
      }

      function hidePreviewSoon() {
        if (previewTimer !== null) clearTimeout(previewTimer)
        previewTimer = setTimeout(() => {
          preview.hidden = true
          preview.textContent = ''
          previewTimer = null
        }, 80)
      }

      function showPreview(occurrences, anchor) {
        if (previewTimer !== null) clearTimeout(previewTimer)
        previewTimer = null
        preview.textContent = ''
        for (const occurrence of occurrences) {
          const quote = quotes.get(occurrence.ref)
          if (quote === undefined) continue
          const item = document.createElement('div')
          item.setAttribute('data-quote-preview-item', '')
          const text = document.createElement('div')
          text.setAttribute('data-quote-preview-text', '')
          text.textContent = quote.text
          const remove = document.createElement('button')
          remove.type = 'button'
          remove.textContent = '×'
          remove.setAttribute('aria-label', '删除引用')
          remove.addEventListener('click', () => { removeQuote(occurrence) })
          item.append(text, remove)
          preview.appendChild(item)
        }
        if (!preview.hasChildNodes()) return
        positionPreview(anchor)
        preview.hidden = false
      }

      function removeMarker(ref) {
        const marker = markers.get(ref)
        if (marker === undefined) return
        marker.button.remove()
        marker.preview.remove()
        markers.delete(ref)
      }

      function positionMarker(marker) {
        try {
          const bounds = marker.range.getBoundingClientRect()
          if (bounds.width === 0 && bounds.height === 0) {
            marker.button.hidden = true
            marker.preview.hidden = true
            return
          }
          marker.button.style.left = `${Math.min(window.innerWidth - 28, Math.max(6, bounds.right + 5))}px`
          marker.button.style.top = `${Math.max(6, bounds.top - 3)}px`
          marker.button.hidden = false
          if (!marker.anchored && !marker.preview.hidden) {
            const buttonBounds = marker.button.getBoundingClientRect()
            marker.preview.style.left = `${buttonBounds.left}px`
            marker.preview.style.top = `${buttonBounds.bottom + 8}px`
          }
        } catch {
          marker.button.hidden = true
          marker.preview.hidden = true
        }
      }

      function createMarker(quote, range) {
        if (range === null) return
        const markerButton = document.createElement('button')
        markerButton.type = 'button'
        markerButton.setAttribute(`data-${MARKER_ID}`, '')
        markerButton.textContent = '1'
        markerButton.setAttribute('aria-label', '已添加 1 条引用')
        const markerPreview = document.createElement('div')
        markerPreview.setAttribute(`data-${PREVIEW_ID}`, '')
        markerPreview.textContent = quote.text
        markerPreview.hidden = true
        const anchored = typeof CSS !== 'undefined' && CSS.supports?.('anchor-name: --dsh-add-to-chat-anchor') === true
        if (anchored) {
          const anchorName = `--dsh-add-to-chat-${quote.ref.replace(/[^a-z0-9-]/giu, '')}`
          markerButton.style.setProperty('anchor-name', anchorName)
          markerPreview.style.setProperty('position-anchor', anchorName)
          markerPreview.setAttribute('data-anchored', '')
        }
        const marker = { button: markerButton, preview: markerPreview, range, anchored }
        markerButton.addEventListener('mouseenter', () => { markerPreview.hidden = false; positionMarker(marker) })
        markerButton.addEventListener('mouseleave', () => { markerPreview.hidden = true })
        markerButton.addEventListener('focus', () => { markerPreview.hidden = false; positionMarker(marker) })
        markerButton.addEventListener('blur', () => { markerPreview.hidden = true })
        markerButton.addEventListener('click', () => { markerPreview.hidden = !markerPreview.hidden; positionMarker(marker) })
        document.body.append(markerButton, markerPreview)
        markers.set(quote.ref, marker)
        positionMarker(marker)
      }

      function removeQuote(occurrence) {
        const input = currentInput()
        if (input?.removeReference?.(occurrence.occurrenceId) !== true) return
        quotes.delete(occurrence.ref)
        removeMarker(occurrence.ref)
        refreshQuoteRail()
      }

      function refreshQuoteRail() {
        const input = currentInput()
        const occurrences = input?.state.getSnapshot().occurrences.filter(
          occurrence => occurrence.source === QUOTE_SOURCE,
        ) || []
        for (const ref of markers.keys()) {
          if (!occurrences.some(occurrence => occurrence.ref === ref)) removeMarker(ref)
        }
        rail.textContent = ''
        if (occurrences.length === 0) {
          rail.hidden = true
          hidePreviewSoon()
          return
        }
        const card = document.querySelector(CARD_SELECTOR)
        if (card === null) {
          rail.hidden = true
          return
        }
        const pill = document.createElement('button')
        pill.type = 'button'
        pill.setAttribute('data-quote-pill', '')
        pill.textContent = `引用 ${occurrences.length} 条`
        pill.addEventListener('mouseenter', () => { showPreview(occurrences, pill) })
        pill.addEventListener('mouseleave', hidePreviewSoon)
        pill.addEventListener('focus', () => { showPreview(occurrences, pill) })
        pill.addEventListener('blur', hidePreviewSoon)
        pill.addEventListener('click', () => {
          if (preview.hidden) showPreview(occurrences, pill)
          else hidePreviewSoon()
        })
        const removeAll = document.createElement('button')
        removeAll.type = 'button'
        removeAll.setAttribute('data-quote-remove-all', '')
        removeAll.textContent = '×'
        removeAll.setAttribute('aria-label', '删除全部引用')
        removeAll.addEventListener('click', () => {
          for (const occurrence of occurrences) removeQuote(occurrence)
        })
        rail.append(pill, removeAll)
        const bounds = card.getBoundingClientRect()
        rail.style.left = `${Math.max(12, Math.min(bounds.left, window.innerWidth - 12))}px`
        rail.style.top = `${Math.max(8, bounds.top - 38)}px`
        rail.hidden = false
      }

      function observeCurrentInput() {
        const input = currentInput()
        if (input === observedInput) return
        inputOff?.()
        observedInput = input
        inputOff = input?.state.subscribe(refreshQuoteRail) || null
        refreshQuoteRail()
      }

      function addToDraft() {
        const input = currentInput()
        if (!input || selectedText === '') return
        const snapshot = input.state.getSnapshot()
        const ref = referenceId()
        const quote = { ref, text: selectedText }
        quotes.set(ref, quote)
        const end = detectEnd(snapshot)
        const inserted = input.insertReference({
          source: QUOTE_SOURCE,
          ref,
          label: compactLabel(selectedText),
          clipboardText: selectedText,
        }, { start: end, end, draftRev: snapshot.draftRev })
        if (!inserted) {
          quotes.delete(ref)
          return
        }
        createMarker(quote, selectedRange)
        window.getSelection()?.removeAllRanges()
        hideAction()
        refreshQuoteRail()
      }

      const onPointerDown = event => {
        if (!action.contains(event.target)) hideAction()
      }
      const onKeyDown = event => {
        if (event.key === 'Escape') hideAction()
      }
      const onViewportChange = () => {
        hideAction()
        refreshQuoteRail()
        for (const marker of markers.values()) positionMarker(marker)
      }
      const source = {
        trigger: '@',
        name: QUOTE_SOURCE,
        candidates: async () => [],
        onPick: () => undefined,
        codec: {
          clipboardText: ref => quotes.get(ref)?.text || '',
          serialize: async ref => {
            const quote = quotes.get(ref)
            if (quote === undefined) throw new Error('assistant quote is no longer available')
            return `${QUOTE_LABEL}\n${quote.text}`
          },
        },
      }
      ctx.effect(() => ctx.inputTriggers.registerSource(source), 'dsh-add-to-chat: quote serializer')
      button.addEventListener('click', addToDraft)
      document.addEventListener('selectionchange', updateAction)
      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('keydown', onKeyDown, true)
      window.addEventListener('resize', onViewportChange)
      window.addEventListener('scroll', onViewportChange, true)
      const sessionsOff = ctx.sessions.list.subscribe(observeCurrentInput)
      observeCurrentInput()

      return () => {
        button.removeEventListener('click', addToDraft)
        document.removeEventListener('selectionchange', updateAction)
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('keydown', onKeyDown, true)
        window.removeEventListener('resize', onViewportChange)
        window.removeEventListener('scroll', onViewportChange, true)
        sessionsOff()
        inputOff?.()
        action.remove()
        rail.remove()
        preview.remove()
        for (const marker of markers.values()) {
          marker.button.remove()
          marker.preview.remove()
        }
      }
    }

    return {
      name: 'dsh-add-to-chat',
      inject: ['sessions', 'conversation', 'inputTriggers'],
      apply,
    }
  },
})
