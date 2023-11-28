import { isObject, set } from 'lodash-es'

// The simplest doc update: set one or several key/values
export const basicUpdater = (attribute, value, doc) => {
  // /!\ imperfect polymorphism:
  // Object.assign doesn't handle deep values while set does
  if (isObject(attribute)) return Object.assign(doc, attribute)
  else return set(doc, attribute, value)
}

// In case key/values are passed in one object
// value will passed undefined anyway
export const BasicUpdater = (attribute, value) => basicUpdater.bind(null, attribute, value)

export const wrappedUpdater = (db, id, attribute, value) => db.update(id, BasicUpdater(attribute, value))

export const WrappedUpdater = db => wrappedUpdater.bind(null, db)
