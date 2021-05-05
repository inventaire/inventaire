// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const { pass, entityUri, userId, BoundedString } = require('./common')

const attributes = require('../attributes/task')

module.exports = {
  pass,
  // in attributes/task.js, attributes keys should match
  // db keys to verify if attribute is updatable
  attribute: attribute => Object.keys(attributes).includes(attribute),
  type: taskType => attributes.type.includes(taskType),
  entitiesType: entitiesType => attributes.entitiesType.includes(entitiesType),
  state: taskState => attributes.state.includes(taskState),
  suspectUri: entityUri,
  lexicalScore: _.isNumber,
  relationScore: _.isNumber,
  externalSourcesOccurrences: _.isArray,
  reporter: userId,
  clue: BoundedString(0, 500)
}
