import _ from 'builders/utils'
import { pass, entityUri, userId, BoundedString } from './common'
import attributes from '../attributes/task'

export default {
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
