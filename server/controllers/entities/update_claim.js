
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')

module.exports = (req, res) => {
  let prefix
  let { id, uri, property, 'old-value': oldVal, 'new-value': newVal } = req.body
  _.log(req.body, 'update claim input')
  if (_.isInvEntityId(id) && (uri == null)) { uri = `inv:${id}` }

  if (uri == null) return error_.bundleMissingBody(req, res, 'uri')
  if (property == null) return error_.bundleMissingBody(req, res, 'property')
  if ((oldVal == null) && (newVal == null)) {
    return error_.bundleMissingBody(req, res, 'old-value|new-value')
  }

  // An empty string is interpreted as a null value
  oldVal = parseEmptyValue(oldVal)
  newVal = parseEmptyValue(newVal);

  [ prefix, id ] = uri.split(':')
  const updater = updaters[prefix]
  if (updater == null) {
    return error_.bundle(req, res, `unsupported uri prefix: ${prefix}`, 400, uri)
  }

  return updater(req.user, id, property, oldVal, newVal)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const parseEmptyValue = value => value === '' ? null : value

const updaters = {
  // TODO: accept ISBN URIs
  inv: require('./lib/update_inv_claim'),
  wd: require('./lib/update_wd_claim')
}
