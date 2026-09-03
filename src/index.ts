/** Node entry for the browser-only DSH add-to-chat plugin. */
export const name = 'dsh-add-to-chat'

/** The plugin has no Host capability; its behavior lives in client.js. */
export function apply(): void {}

export default { name, apply }
