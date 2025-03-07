import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { isValidIsbn } from '#lib/isbn/isbn'
import { objectKeys } from '#lib/utils/types'
import type { EntityUri } from '#types/entity'

export const uriValidatorByPrefix = {
  inv: isInvEntityId,
  wd: isWdEntityId,
  isbn: isValidIsbn,
} as const

export const uriPrefixes = objectKeys(uriValidatorByPrefix)

export function isValidEntityUri (uri: EntityUri) {
  const [ prefix, id ] = uri.split(':')
  return uriValidatorByPrefix[prefix](id)
}
