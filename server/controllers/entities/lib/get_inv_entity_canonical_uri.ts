// A canonical URI is the prefered URI to refer to an entity,
import { newError } from '#lib/error/error'
import type { EntityUri, InvEntityDoc, RedirectFromTo } from '#server/types/entity'
// typically, an isbn: URI rather than an inv: one
// Those URIs are the only URIs used to bound items to entities and
// in entities claims, and are used in the client to build entities URLs
// to which alias URIs redirect
// Ex: /entity/inv:#{invId} redirects to /entity/isbn:#{isbn}
import { getInvUriFromDoc } from './get_inv_uri_from_doc.js'
import { prefixifyInv } from './prefix.js'

function _getInvEntityCanonicalUri (entity: InvEntityDoc): EntityUri
function _getInvEntityCanonicalUri (entity: InvEntityDoc, includeRedirection: true): [ EntityUri, RedirectFromTo ]
function _getInvEntityCanonicalUri (entity: InvEntityDoc, includeRedirection?: boolean) {
  const { _id: invId } = entity
  if (invId == null) throw newError('missing id', 500, { entity })
  const invUri = prefixifyInv(invId)

  // Case when the entity document is simply a redirection to another entity
  // signaled via the 'redirect' attribute on the entity document
  if ('redirect' in entity) {
    const { redirect } = entity
    const redirectsObj: RedirectFromTo = { from: invUri, to: redirect }
    return formatResult(redirect, redirectsObj, includeRedirection)
  }
  const uri = getInvUriFromDoc(entity)

  let redirectsObj
  if (uri !== invUri) {
    redirectsObj = { from: invUri, to: uri }
  }

  return formatResult(uri, redirectsObj, includeRedirection)
}

export const getInvEntityCanonicalUri = (entity: InvEntityDoc) => _getInvEntityCanonicalUri(entity)
export const getInvEntityCanonicalUriAndRedirection = (entity: InvEntityDoc) => _getInvEntityCanonicalUri(entity, true)

function formatResult (uri: EntityUri, redirectsObj: RedirectFromTo, includeRedirection) {
  if (includeRedirection) {
    return [ uri, redirectsObj ]
  } else {
    return uri
  }
}
