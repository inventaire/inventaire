const _ = require('builders/utils')

// The simplest doc update: set one or several key/values
const basicUpdater = (attribute, value, doc) => {
  // /!\ imperfect polymorphism:
  // Object.assign doesn't handle deep values while _.set does
  if (_.isObject(attribute)) return Object.assign(doc, attribute)
  else return _.set(doc, attribute, value)
}

// In case key/values are passed in one object
// value will passed undefined anyway
const BasicUpdater = (attribute, value) => basicUpdater.bind(null, attribute, value)

const wrappedUpdater = (db, id, attribute, value) => db.update(id, BasicUpdater(attribute, value))

const WrappedUpdater = db => wrappedUpdater.bind(null, db)

module.exports = { basicUpdater, BasicUpdater, wrappedUpdater, WrappedUpdater }
