import { isArray, isNumber } from 'lodash-es'
import attributes from '../attributes/task.js'
import commonValidations from './common.js'

const { pass, entityUri, userId, BoundedString } = commonValidations

export default {
  pass,
  // in attributes/task.js, attributes keys should match
  // db keys to verify if attribute is updatable
  attribute: attribute => Object.keys(attributes).includes(attribute),
  type: taskType => attributes.type.includes(taskType),
  entitiesType: entitiesType => attributes.entitiesType.includes(entitiesType),
  state: taskState => attributes.state.includes(taskState),
  suspectUri: entityUri,
  lexicalScore: isNumber,
  relationScore: isNumber,
  externalSourcesOccurrences: isArray,
  reporter: userId,
  clue: BoundedString(0, 500),
}
