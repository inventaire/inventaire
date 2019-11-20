

// Fix any style issues and re-enable lint.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const customQueries = {
  'author-works': require('./lib/get_author_works'),
  'serie-parts': require('./lib/get_serie_parts')
}

module.exports = (req, res, next) => {
  let { uri, refresh, action } = req.query

  if (!_.isEntityUri(uri)) {
    return error_.bundleInvalid(req, res, 'uri', uri)
  }

  refresh = _.parseBooleanString(refresh)

  return customQueries[action]({ uri, refresh })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
