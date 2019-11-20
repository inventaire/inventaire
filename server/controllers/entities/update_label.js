/* eslint-disable
    prefer-const,
*/

// Fix any style issues and re-enable lint.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')

module.exports = (req, res) => {
  let { uri, lang, value } = req.body
  let { id } = req.body
  _.log(req.body, 'update label body')
  if (_.isInvEntityId(id) && (uri == null)) { uri = `inv:${id}` }

  if (uri == null) return error_.bundleMissingBody(req, res, 'uri')
  if (lang == null) return error_.bundleMissingBody(req, res, 'lang')
  if (value == null) return error_.bundleMissingBody(req, res, 'value')

  let prefix
  [ prefix, id ] = uri.split(':')
  const updater = updaters[prefix]
  if (updater == null) {
    return error_.bundle(req, res, `unsupported uri prefix: ${prefix}`, 400, uri)
  }

  if (!_.isLang(lang)) {
    return error_.bundleInvalid(req, res, 'lang', lang)
  }

  value = _.isString(value) ? value.trim() : value

  if (!_.isNonEmptyString(value)) {
    return error_.bundleInvalid(req, res, 'value', value)
  }

  return updater(req.user, id, lang, value)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const updaters = {
  inv: require('./lib/update_inv_label'),
  wd: require('./lib/update_wd_label')
}
