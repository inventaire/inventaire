/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

// the simplest doc update: set one or several key/values
const basicUpdater = function(attribute, value, doc){
  // /!\ imperfect polymorphism:
  // _.extend doesn't handle deep values while _.set does
  if (_.isObject(attribute)) { return _.extend(doc, attribute)
  } else { return _.set(doc, attribute, value) }
}

const BasicUpdater = (attribute, value) => // in case key/values are passed in one object
// value will passed undefined anyway
  basicUpdater.bind(null, attribute, value)

const wrappedUpdater = (db, id, attribute, value) => db.update(id, BasicUpdater(attribute, value))

const WrappedUpdater = db => wrappedUpdater.bind(null, db)

module.exports = { basicUpdater, BasicUpdater, wrappedUpdater, WrappedUpdater }
