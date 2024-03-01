import { isArray, isString } from 'lodash-es'
import { isVisibilityGroupKey } from '#lib/boolean_validations'

export const visibilityKeywords = [
  'friends',
  'groups',
  'public',
] as const

export function isVisibilityKey (value) {
  if (!isString(value)) return false
  if (visibilityKeywords.includes(value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

export const isVisibilityKeyArray = arr => isArray(arr) && arr.every(isVisibilityKey)
