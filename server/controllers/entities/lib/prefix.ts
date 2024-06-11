import { isPropertyId } from 'wikibase-sdk'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import type { EntityUri, InvEntityId, IsbnEntityUri, NormalizedIsbn, PropertyUri, WdEntityId, WdPropertyId } from '#types/entity'
import type { Split } from 'type-fest'

export function prefixify <I extends string, P extends string> (id: I, prefix?: P) {
  if (prefix) return `${prefix}:${id}` as `${P}:${I}`
  if (isWdEntityId(id)) return `wd:${id}` as `wd:${I}`
  else if (isInvEntityId(id)) return `inv:${id}` as `inv:${I}`
  else if (isPropertyId(id)) return `wdt:${id}` as `wdt:${I}`
  else if (isValidIsbn(id)) return `isbn:${normalizeIsbn(id)}` as IsbnEntityUri
  else throw new Error('unknown id format')
}

export const prefixifyWd = <T extends WdEntityId> (id: WdEntityId) => `wd:${id}` as `wd:${T}`
export const prefixifyInv = <T extends InvEntityId> (id: InvEntityId) => `inv:${id}` as `inv:${T}`
export const prefixifyWdProperty = <T extends WdPropertyId> (id: T) => `wdt:${id}` as `wdt:${T}`
export const prefixifyIsbn = <T extends NormalizedIsbn> (isbn: T) => `isbn:${normalizeIsbn(isbn)}` as `isbn:${T}`

export function unprefixify <T extends EntityUri | PropertyUri> (uri: T) {
  return uri.split(':')[1] as Split<T, ':'>[1]
}
