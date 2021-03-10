// A canonical URI is the prefered URI to refer to an entity,
// typically, an isbn: URI rather than an inv: one
// Those URIs are the only URIs used to bound items to entities and
// in entities claims, and are used in the client to build entities URLs
// to which alias URIs redirect
// Ex: /entity/inv:#{invId} redirects to /entity/isbn:#{isbn}
const error_ = require('lib/error/error')
const getInvUriFromDoc = require('./get_inv_uri_from_doc')
const { prefixifyInv } = require('./prefix')

module.exports = (entity, options) => {
  const { _id: invId, redirect } = entity
  if (invId == null) throw error_.new('missing id', 500, entity)
  const invUri = prefixifyInv(invId)

  // Case when the entity document is simply a redirection to another entity
  // signaled via the 'redirect' attribute on the entity document
  if (redirect) {
    const redirectsObj = { from: invUri, to: redirect }
    return formatResult(redirect, redirectsObj, options)
  }
  const uri = getInvUriFromDoc(entity)

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
