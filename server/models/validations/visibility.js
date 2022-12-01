const _ = require('builders/utils')
const { isVisibilityGroupKey } = require('lib/boolean_validations')

const keywordValues = [
  'friends',
  'groups',
  'public',
]

const isVisibilityKey = value => {
  if (!_.isString(value)) return false
  if (keywordValues.includes(value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

const isVisibilityKeyArray = arr => _.isArray(arr) && arr.every(isVisibilityKey)

module.exports = {
  isVisibilityKey,
  isVisibilityKeyArray,
}
