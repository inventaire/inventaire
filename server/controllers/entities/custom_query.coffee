__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
customQueries =
  'author-works': require './lib/get_author_works'
  'serie-parts': require './lib/get_serie_parts'

module.exports = (req, res, next)->
  { uri, refresh, action } = req.query

  unless _.isEntityUri uri
    return error_.bundleInvalid req, res, 'uri', uri

  refresh = _.parseBooleanString refresh

  customQueries[action] uri, refresh
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
