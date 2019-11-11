// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { pass, entityUri } = require('./common')

const attributes = require('../attributes/task')

module.exports = {
  pass,
  // in attributes/task.coffee, attributes keys should match
  // db keys to verify if attribute is updatable
  attribute(attribute){ let needle
    return (needle = attribute, _.keys(attributes).includes(needle)) },
  type(taskType){ return attributes.type.includes(taskType) },
  state(taskState){ return attributes.state.includes(taskState) },
  suspectUri: entityUri,
  lexicalScore: _.isNumber,
  relationScore: _.isNumber,
  externalSourcesOccurrences: _.isArray
}
