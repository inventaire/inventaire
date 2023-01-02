import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
// TODO: accept ISBN URIs
import inv from './lib/update_inv_claim.js'
import wd from './lib/update_wd_claim.js'

const sanitization = {
  id: { optional: true },
  uri: { optional: true },
  property: {},
  'old-value': { optional: true },
  'new-value': { optional: true },
}

const controller = async (params, req) => {
  let { id, uri, property, oldValue, newValue } = params
  let prefix
  _.log(params, 'update claim input')
  if (_.isInvEntityId(id) && uri == null) uri = `inv:${id}`

  if (uri == null) throw error_.newMissingBody('uri')
  if (oldValue == null && newValue == null) {
    throw error_.newMissingBody('old-value|new-value')
  }

  // An empty string is interpreted as a null value
  oldValue = parseEmptyValue(oldValue)
  newValue = parseEmptyValue(newValue)

  ;[ prefix, id ] = uri.split(':')
  const updater = updaters[prefix]
  if (updater == null) {
    throw error_.new(`unsupported uri prefix: ${prefix}`, 400, uri)
  }

  await updater(req.user, id, property, oldValue, newValue)
  return { ok: true }
}

const parseEmptyValue = value => value === '' ? null : value

const updaters = {
  inv,
  wd,
}

export default { sanitization, controller }
