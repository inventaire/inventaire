__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getAuthorWorks = require './lib/get_author_works'

module.exports = (req, res, next)->
  { uri, refresh } = req.query

  unless _.isEntityUri uri
    return error_.bundle req, res, 'invalid uri', 400

  getAuthorWorks uri, refresh
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
