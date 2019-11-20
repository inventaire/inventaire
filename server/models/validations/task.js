
/*
 * decaffeinate suggestions:
 * DS104: Avoid inline assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { pass, entityUri } = require('./common')

const attributes = require('../attributes/task')

module.exports = {
  pass,
  // in attributes/task.js, attributes keys should match
  // db keys to verify if attribute is updatable
  attribute: attribute => Object.keys(attributes).includes(attribute),
  type: taskType => attributes.type.includes(taskType),
  state: taskState => attributes.state.includes(taskState),
  suspectUri: entityUri,
  lexicalScore: _.isNumber,
  relationScore: _.isNumber,
  externalSourcesOccurrences: _.isArray
}
