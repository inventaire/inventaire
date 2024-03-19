import { isPropertyId } from 'wikibase-sdk'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import type { InvEntityId, InvEntityUri, Isbn, IsbnEntityUri, WdEntityId, WdEntityUri, WdPropertyId, WdPropertyUri } from '#types/entity'

export function prefixify (id: string, prefix?: string) {
  if (prefix) return `${prefix}:${id}`
  if (isWdEntityId(id)) return `wd:${id}` as WdEntityUri
  else if (isInvEntityId(id)) return `inv:${id}` as InvEntityUri
  else if (isPropertyId(id)) return `wdt:${id}` as WdPropertyUri
  else if (isValidIsbn(id)) return `isbn:${normalizeIsbn(id)}` as IsbnEntityUri
  else throw new Error('unknown id format')
}

export const Prefixify = prefix => id => prefixify(id, prefix)

export const prefixifyWd = (id: WdEntityId) => `wd:${id}` as WdEntityUri
export const prefixifyInv = (id: InvEntityId) => `inv:${id}` as InvEntityUri
export const prefixifyWdProperty = (id: WdPropertyId) => `wdt:${id}` as WdPropertyUri
export const prefixifyIsbn = (isbn: Isbn) => `isbn:${normalizeIsbn(isbn)}` as IsbnEntityUri

export const unprefixify = uri => uri.split(':')[1]
