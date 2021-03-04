const _ = require('builders/utils')
const { pass, entityUri, BoundedString } = require('./common')
const { allowedValues, updatable } = require('../attributes/task')

module.exports = {
  pass,
  attribute: attribute => updatable.includes(attribute),
  type: taskType => allowedValues.type.includes(taskType),
  entitiesType: entitiesType => allowedValues.entitiesType.includes(entitiesType),
  state: taskState => allowedValues.state.includes(taskState),
  suspectUri: entityUri,
  lexicalScore: _.isNumber,
  relationScore: _.isNumber,
  externalSourcesOccurrences: _.isArray,
  reporters: reporters => _.isNonEmptyArray(reporters) && reporters.every(_.isUserId),
  clue: BoundedString(0, 500)
}
