const _ = require('builders/utils')
const { isCouchUuid } = require('lib/boolean_validations')

const keywordValues = [
  'network',
  'public',
]

const isGroupKey = value => {
  const [ prefix, id ] = value.split(':')
  return prefix === 'group' && isCouchUuid(id)
}

const isValidVisibilityValue = value => {
  if (!_.isString(value)) return false
  if (keywordValues.includes(value)) return true
  if (isGroupKey(value)) return true
  return false
}

module.exports = arr => _.isArray(arr) && arr.every(isValidVisibilityValue)
