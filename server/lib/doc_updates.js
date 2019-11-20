

// Fix any style issues and re-enable lint.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

// the simplest doc update: set one or several key/values
const basicUpdater = (attribute, value, doc) => {
  // /!\ imperfect polymorphism:
  // Object.assign doesn't handle deep values while _.set does
  if (_.isObject(attribute)) {
    return Object.assign(doc, attribute)
  } else {
    return _.set(doc, attribute, value)
  }
}

const BasicUpdater = (attribute, value) => // in case key/values are passed in one object
// value will passed undefined anyway
  basicUpdater.bind(null, attribute, value)

const wrappedUpdater = (db, id, attribute, value) => db.update(id, BasicUpdater(attribute, value))

const WrappedUpdater = db => wrappedUpdater.bind(null, db)

module.exports = { basicUpdater, BasicUpdater, wrappedUpdater, WrappedUpdater }
