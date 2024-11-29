import type { ViewKey } from 'blue-cot/types/types.js'

/** This function mimicks the `emit` function available in CouchDB views environment
 * As view functions will be stringified, they will keep no reference to this function other than its name */
export function emit (key: ViewKey, value?: unknown) {
  console.error('emit arguments', { key, value })
  throw new Error('This function should never actually be called by the server')
}

/** This function mimicks the `log` function available in CouchDB views environment
 * As view functions will be stringified, they will keep no reference to this function other than its name.
 *
 * From [CouchDB's documentation](https://docs.couchdb.org/en/stable/best-practices/jsdevel.html):
 *   *"The log() function will log output to the CouchDB log file or stream.
 *    You can log strings, objects, and arrays directly, without first converting to JSON"*
 */
export function log (...args: unknown[]) {
  console.error('log arguments', { args })
  throw new Error('This function should never actually be called by the server')
}
