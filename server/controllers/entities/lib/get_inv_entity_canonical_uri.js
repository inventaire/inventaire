// A canonical URI is the prefered URI to refer to an entity,
// typically, an isbn: URI rather than an inv: one
// Those URIs are the only URIs used to bound items to entities and
// in entities claims, and are used in the client to build entities URLs
// to which alias URIs redirect
// Ex: /entity/inv:#{invId} redirects to /entity/isbn:#{isbn}
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const { normalizeIsbn } = __.require('lib', 'isbn/isbn')

module.exports = (entity, options) => {
  const { _id: invId, redirect } = entity

  if (invId == null) throw error_.new('missing id', 500, entity)

  const invUri = `inv:${invId}`

  // Case when the entity document is simply a redirection to another entity
  // signaled via the 'redirect' attribute on the entity document
  if (redirect) {
    const redirectsObj = { from: invUri, to: redirect }
    return formatResult(redirect, redirectsObj, options)
  }

  // Case when the entity document is a proper entity document
  // but has a more broadly recognized URI available, currently only an ISBN
  const { claims } = entity
  const isbn = claims['wdt:P212'] && claims['wdt:P212'][0]

  // Those URIs are aliases but, when available, always use the canonical id,
  // that is, in the only current, the ISBN
  // By internal convention, ISBN URIs are without hyphen
  const uri = isbn ? `isbn:${normalizeIsbn(isbn)}` : invUri

  let redirectsObj
  if (uri !== invUri) {
    redirectsObj = { from: invUri, to: uri }
  }

  return formatResult(uri, redirectsObj, options)
}

const formatResult = (uri, redirectsObj, options) => {
  if (options && options.includeRedirection) return [ uri, redirectsObj ]
  else return uri
}
