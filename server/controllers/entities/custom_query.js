const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const customQueries = {
  'author-works': require('./lib/get_author_works'),
  'serie-parts': require('./lib/get_serie_parts')
}

module.exports = (req, res, next) => {
  const { uri, action } = req.query

  if (!_.isEntityUri(uri)) {
    return error_.bundleInvalid(req, res, 'uri', uri)
  }

  const refresh = _.parseBooleanString(req.query.refresh)

  return customQueries[action]({ uri, refresh })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
