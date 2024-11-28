import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { isInvEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { newMissingBodyError } from '#lib/error/pre_filled'
import { log } from '#lib/utils/logs'
import type { IsbnEntityUri } from '#types/entity'
import { updateInvClaim } from './lib/update_inv_claim.js'
import { updateWdClaim } from './lib/update_wd_claim.js'

const sanitization = {
  id: { optional: true },
  uri: { optional: true },
  property: {},
  'old-value': { optional: true },
  'new-value': { optional: true },
}

async function controller (params, req) {
  let { id, uri, property, oldValue, newValue } = params
  let prefix
  log(params, 'update claim input')
  if (isInvEntityId(id) && uri == null) uri = `inv:${id}`

  if (uri == null) throw newMissingBodyError('uri')
  if (oldValue == null && newValue == null) {
    throw newMissingBodyError('old-value|new-value')
  }

  // An empty string is interpreted as a null value
  oldValue = parseEmptyValue(oldValue)
  newValue = parseEmptyValue(newValue)

  ;[ prefix, id ] = uri.split(':')

  if (prefix === 'isbn') {
    const altUri = await getAltUri(uri)
    if (altUri) [ prefix, id ] = altUri.split(':')
  }

  const updater = updaters[prefix]
  if (updater == null) {
    throw newError(`unsupported uri prefix: ${prefix}`, 400, uri)
  }

  await updater(req.user, id, property, oldValue, newValue)
  return { ok: true }
}

const parseEmptyValue = value => value === '' ? null : value

const updaters = {
  inv: updateInvClaim,
  wd: updateWdClaim,
}

async function getAltUri (uri: IsbnEntityUri) {
  const entity = await getEntityByUri({ uri, refresh: true })
  const wdUri = getFirstClaimValue(entity.claims, 'invp:P1')
  if (wdUri) return wdUri
  if ('_id' in entity) {
    const { _id } = entity
    return `inv:${_id}`
  }
}

export default { sanitization, controller }
