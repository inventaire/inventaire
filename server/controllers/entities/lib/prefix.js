import _ from 'builders/utils'
import wdk from 'wikidata-sdk'
import isbn_ from 'lib/isbn/isbn'

const prefixify = (id, prefix) => {
  if (id == null) return
  if (prefix) return `${prefix}:${id}`

  if (wdk.isItemId(id)) return `wd:${id}`
  else if (_.isInvEntityId(id)) return `inv:${id}`
  else if (wdk.isPropertyId(id)) return `wdt:${id}`
  else if (isbn_.isValidIsbn(id)) return `isbn:${isbn_.normalizeIsbn(id)}`
  else throw new Error('unknown id format')
}

const Prefixify = prefix => id => prefixify(id, prefix)

const prefixifyWd = Prefixify('wd')
const prefixifyWdProperty = Prefixify('wdt')
const prefixifyInv = Prefixify('inv')
const prefixifyIsbn = isbn => prefixify(isbn_.normalizeIsbn(isbn), 'isbn')

const unprefixify = uri => uri.split(':')[1]

export default { prefixify, Prefixify, unprefixify, prefixifyWd, prefixifyWdProperty, prefixifyInv, prefixifyIsbn }
