__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
customQueries =
  'author-works': require './lib/get_author_works'
  'serie-parts': require './lib/get_serie_parts'

module.exports = (req, res, next)->
  { uri, refresh, action } = req.query

  unless _.isEntityUri uri
    return error_.bundle req, res, 'invalid uri', 400

  refresh = _.parseBooleanString refresh

  customQueries[action] uri, refresh
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
