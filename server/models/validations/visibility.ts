import { isArray, isString } from 'lodash-es'
import { isVisibilityGroupKey } from '#lib/boolean_validations'
import { arrayIncludes } from '#lib/utils/base'
import type { VisibilityKey } from '#types/visibility'

export const visibilityKeywords = [
  'friends',
  'groups',
  'public',
] as const

export function isVisibilityKey (value): value is VisibilityKey {
  if (!isString(value)) return false
  if (arrayIncludes(visibilityKeywords, value)) return true
  if (isVisibilityGroupKey(value)) return true
  return false
}

export const isVisibilityKeyArray = arr => isArray(arr) && arr.every(isVisibilityKey)
