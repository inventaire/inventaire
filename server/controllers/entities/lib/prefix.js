import wdk from 'wikidata-sdk'
import _ from '#builders/utils'
import { isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'

export const prefixify = (id, prefix) => {
  if (id == null) return
  if (prefix) return `${prefix}:${id}`

  if (wdk.isItemId(id)) return `wd:${id}`
  else if (_.isInvEntityId(id)) return `inv:${id}`
  else if (wdk.isPropertyId(id)) return `wdt:${id}`
  else if (isValidIsbn(id)) return `isbn:${normalizeIsbn(id)}`
  else throw new Error('unknown id format')
}

export const Prefixify = prefix => id => prefixify(id, prefix)

export const prefixifyWd = Prefixify('wd')
export const prefixifyWdProperty = Prefixify('wdt')
export const prefixifyInv = Prefixify('inv')
export const prefixifyIsbn = isbn => prefixify(normalizeIsbn(isbn), 'isbn')

export const unprefixify = uri => uri.split(':')[1]
