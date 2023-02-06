import _ from '#builders/utils'
import { isVisibilityGroupKey } from '#lib/boolean_validations'

const keywordValues = [
  'friends',
  'groups',
  'public',
]

export const isVisibilityKey = value => {
  if (!_.isString(value)) return false
  if (keywordValues.includes(value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

export const isVisibilityKeyArray = arr => _.isArray(arr) && arr.every(isVisibilityKey)
