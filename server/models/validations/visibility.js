const _ = require('builders/utils')
const { isVisibilityGroupKey } = require('lib/boolean_validations')

const keywordValues = [
  'friends',
  'groups',
  'public',
]

const isValidVisibilityValue = value => {
  if (!_.isString(value)) return false
  if (keywordValues.includes(value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

module.exports = arr => _.isArray(arr) && arr.every(isValidVisibilityValue)
