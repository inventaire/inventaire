
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wdk = require('wikidata-sdk')
const isbn_ = __.require('lib', 'isbn/isbn')

const prefixify = (id, prefix) => {
  if (id == null) return
  if (prefix != null) return `${prefix}:${id}`

  if (wdk.isItemId(id)) {
    return `wd:${id}`
  } else if (_.isInvEntityId(id)) {
    return `inv:${id}`
  } else if (wdk.isPropertyId(id)) {
    return `wdt:${id}`
  } else if (isbn_.isValidIsbn(id)) {
    return `isbn:${isbn_.normalizeIsbn(id)}`
  } else {
    throw new Error('unknown id format')
  }
}

const Prefixify = prefix => id => prefixify(id, prefix)

const prefixifyWd = Prefixify('wd')
const prefixifyInv = Prefixify('inv')
const prefixifyIsbn = isbn => prefixify(isbn_.normalizeIsbn(isbn), 'isbn')

const unprefixify = uri => uri.split(':')[1]

const getInvEntityUri = entity => {
  const { _id } = entity
  if (_id != null) return `inv:${_id}`
}

module.exports = { prefixify, Prefixify, unprefixify, prefixifyWd, prefixifyInv, prefixifyIsbn, getInvEntityUri }
