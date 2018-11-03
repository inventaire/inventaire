__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
sanitize = __.require 'lib', 'sanitize/sanitize'
entities_ = require './entities'
importToWikidata = require './lib/import_to_wikidata'

sanitization =
  uri: {}

module.exports = (req, res)->
  user = req.user
  sanitize req, res, sanitization
  .then (params)-> importToWikidata user, params.uri
  .then responses_.Send(res)
  .then Track(req, ['entity', 'importToWikidata'])
  .catch error_.Handler(req, res)
