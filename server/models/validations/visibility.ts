import { isArray, isString } from 'lodash-es'
import { isVisibilityGroupKey } from '#lib/boolean_validations'

const keywordValues = [
  'friends',
  'groups',
  'public',
]

export const isVisibilityKey = value => {
  if (!isString(value)) return false
  if (keywordValues.includes(value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

export const isVisibilityKeyArray = arr => isArray(arr) && arr.every(isVisibilityKey)
