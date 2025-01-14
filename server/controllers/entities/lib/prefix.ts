import { isPropertyId } from 'wikibase-sdk'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import { assertString } from '#lib/utils/assert_types'
import type { EntityUri, InvEntityId, IsbnEntityUri, NormalizedIsbn, PropertyUri, WdEntityId, WdEntityUri, WdPropertyId } from '#types/entity'
import type { Split } from 'type-fest'

export function prefixify <I extends string, P extends string> (id: I, prefix?: P) {
  assertString(id)
  if (prefix) return `${prefix}:${id}` as `${P}:${I}`
  if (isWdEntityId(id)) return `wd:${id}` as `wd:${I}`
  else if (isInvEntityId(id)) return `inv:${id}` as `inv:${I}`
  else if (isPropertyId(id)) return `wdt:${id}` as `wdt:${I}`
  else if (isValidIsbn(id)) return `isbn:${normalizeIsbn(id)}` as IsbnEntityUri
  else throw new Error('unknown id format')
}

export function prefixifyWd <T extends WdEntityId> (id: WdEntityId) {
  assertString(id)
  return `wd:${id}` as `wd:${T}`
}
export function prefixifyInv <T extends InvEntityId> (id: InvEntityId) {
  assertString(id)
  return `inv:${id}` as `inv:${T}`
}
export function prefixifyWdProperty <T extends WdPropertyId> (id: T) {
  assertString(id)
  return `wdt:${id}` as `wdt:${T}`
}
export function prefixifyIsbn <T extends NormalizedIsbn> (isbn: T) {
  assertString(isbn)
  return `isbn:${normalizeIsbn(isbn)}` as `isbn:${T}`
}

export function unprefixify <T extends EntityUri | PropertyUri> (uri: T) {
  assertString(uri)
  return uri.split(':')[1] as Split<T, ':'>[1]
}

export function getWdEntityUriNumericId (uri: WdEntityUri) {
  return parseInt(uri.replace('wd:Q', ''))
}
