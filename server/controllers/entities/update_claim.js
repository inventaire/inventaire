const _ = require('builders/utils')
const error_ = require('lib/error/error')

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
  // TODO: accept ISBN URIs
  inv: require('./lib/update_inv_claim'),
  wd: require('./lib/update_wd_claim')
}

module.exports = { sanitization, controller }
