# dsh-add-to-chat

[简体中文](README.md)

Select text in a DSH assistant reply and choose **Add to chat**. The plugin keeps the selection as a separate annotation and submits it as plugin-source context only when the user sends their next message.

## Demo

1. Select text in an assistant reply, then choose the floating **Add to chat** action.

![Add to chat action after selecting text](docs/images/add-to-chat-selection-action.png)

2. Add as many annotations as needed. The composer remains plain text; hover the “x annotations” pill to read and remove individual selections.

![Hover preview of two separate annotations](docs/images/add-to-chat-draft-contexts.png)

3. Keep writing normally and send. The annotations travel as independent context for that submission, are consumed after a successful send, and return if the submission fails.

![Hover preview of a submitted annotation above its user message](docs/images/add-to-chat-submitted-annotation.png)

## Features

- Browser-only DSH client plugin; no Host service or product-specific integration.
- Each selection stays within one assistant reply; multiple annotations can be added in succession.
- Does not send automatically. The user can edit ordinary draft text or send annotations without text.
- The “x annotations” hover card shows the full source text and supports individual or bulk removal.
- It never writes Markdown, hidden nodes, or chips into the Lexical editor, so Backspace cannot remove an annotation by accident.
- A small marker remains beside the original selection while its annotation awaits submission.

## Compatibility

The plugin relies on two semantic extensions only: an assistant body marked with `data-dsh-message-role="assistant"`, and the `conversation.draftContexts` submission service. It does not depend on page CSS classes, a Host service, or product-specific code.

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
