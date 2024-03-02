import { set } from 'lodash-es'
import type { CouchDoc } from '#types/common'

// The simplest doc update: set one key
export function basicUpdater (attribute: string, value: unknown, doc: CouchDoc) {
  return set(doc, attribute, value)
}

// In case key/values are passed in one object
// value will passed undefined anyway
export const BasicUpdater = (attribute: string, value: unknown) => basicUpdater.bind(null, attribute, value)

export const wrappedUpdater = (db, id, attribute, value) => db.update(id, BasicUpdater(attribute, value))

export const WrappedUpdater = db => wrappedUpdater.bind(null, db)
