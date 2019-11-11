// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A canonical URI is the prefered URI to refer to an entity,
// typically, an isbn: URI rather than an inv: one
// Those URIs are the only URIs used to bound items to entities and
// in entities claims, and are used in the client to build entities URLs
// to which alias URIs redirect
// Ex: /entity/inv:#{invId} redirects to /entity/isbn:#{isbn}
const __ = require('config').universalPath
const { normalizeIsbn } = __.require('lib', 'isbn/isbn')
const error_ = __.require('lib', 'error/error')

module.exports = function(entity, options){
  let redirectsObj, uri
  const { _id:invId, redirect } = entity

  if (invId == null) throw error_.new('missing id', 500, entity)

  const invUri = `inv:${invId}`

  // Case when the entity document is simply a redirection to another entity
  // signaled via the 'redirect' attribute on the entity document
  if (redirect != null) {
    redirectsObj = { from: invUri, to: redirect }
    return formatResult(redirect, redirectsObj, options)
  }

  // Case when the entity document is a proper entity document
  // but has a more broadly recognized URI available, currently only an ISBN
  const isbn = entity.claims['wdt:P212'] != null ? entity.claims['wdt:P212'][0] : undefined

  // Those URIs are aliases but, when available, always use the canonical id,
  // that is, in the only current, the ISBN
  // By internal convention, ISBN URIs are without hyphen
  if (isbn != null) { uri = `isbn:${normalizeIsbn(isbn)}`
  } else { uri = invUri }

  redirectsObj = null
  if (uri !== invUri) {
    redirectsObj = { from: invUri, to: uri }
  }

  return formatResult(uri, redirectsObj, options)
}

var formatResult = function(uri, redirectsObj, options){
  if ((options != null ? options.includeRedirection : undefined)) { return [ uri, redirectsObj ]
  } else { return uri }
}
