import { isPropertyId } from 'wikibase-sdk'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import { assert_ } from '#lib/utils/assert_types'
import type { EntityUri, InvEntityId, IsbnEntityUri, NormalizedIsbn, PropertyUri, WdEntityId, WdPropertyId } from '#types/entity'
import type { Split } from 'type-fest'

export function prefixify <I extends string, P extends string> (id: I, prefix?: P) {
  assert_.string(id)
  if (prefix) return `${prefix}:${id}` as `${P}:${I}`
  if (isWdEntityId(id)) return `wd:${id}` as `wd:${I}`
  else if (isInvEntityId(id)) return `inv:${id}` as `inv:${I}`
  else if (isPropertyId(id)) return `wdt:${id}` as `wdt:${I}`
  else if (isValidIsbn(id)) return `isbn:${normalizeIsbn(id)}` as IsbnEntityUri
  else throw new Error('unknown id format')
}

export function prefixifyWd <T extends WdEntityId> (id: WdEntityId) {
  assert_.string(id)
  return `wd:${id}` as `wd:${T}`
}
export function prefixifyInv <T extends InvEntityId> (id: InvEntityId) {
  assert_.string(id)
  return `inv:${id}` as `inv:${T}`
}
export function prefixifyWdProperty <T extends WdPropertyId> (id: T) {
  assert_.string(id)
  return `wdt:${id}` as `wdt:${T}`
}
export function prefixifyIsbn <T extends NormalizedIsbn> (isbn: T) {
  assert_.string(isbn)
  return `isbn:${normalizeIsbn(isbn)}` as `isbn:${T}`
}

export function unprefixify <T extends EntityUri | PropertyUri> (uri: T) {
  assert_.string(uri)
  return uri.split(':')[1] as Split<T, ':'>[1]
}
