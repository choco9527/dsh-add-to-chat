# dsh-add-to-chat

[简体中文](README.md)

Select text in a DSH assistant reply and choose **Add to chat**. The plugin adds a structured quote chip to the current composer and expands it into the selected assistant text only when the user sends their next message.

## Scope

- Browser-only DSH client plugin; no Host service or product-specific integration.
- Works with a selection from one assistant message.
- Does not send a message automatically. The user can edit the draft before sending.
- The composer shows a removable quote count with a hover preview. It is not Markdown pasted into the user's draft.
- A small marker remains beside the original selection while the quote is in the composer.

## Compatibility

The plugin identifies reply ownership through the assistant body's `data-dsh-message-role="assistant"` marker rather than unstable CSS class names. The host must provide that semantic marker, structured reference insertion and serialization, and `SessionInput.removeReference()`.

## Install

```sh
dsh plugin --profile web add dsh-add-to-chat
```

For DSH Desktop, install into the active Desktop profile. The Electron renderer uses the same DSH Web client module graph.

## Development

```sh
corepack pnpm install
corepack pnpm run check
dsh plugin --profile web add .
```

Restart the selected DSH profile after installation. Do not also manually add this plugin id to a profile `cordis.patch.yml`: the bundle already registers itself.

## License

MIT
