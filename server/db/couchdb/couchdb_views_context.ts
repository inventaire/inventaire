import type { ViewKey } from 'blue-cot/types/types.js'

/** This function mimicks the `emit` function available in CouchDB views environment
 * As view functions will be stringified, they will keep no reference to this function other than its name */
export function emit (key: ViewKey, value?: unknown) {
  console.error('emit arguments', { key, value })
  throw new Error('This function should never actually be called by the server')
}
