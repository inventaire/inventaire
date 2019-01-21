CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'
resolveExternalIds = require './resolve_external_ids'

module.exports = (author)->
  resolveExternalIds author.claims
  .then (uris)->
    unless uris then return work
    if uris.length is 1 then author.uri = uris[0]
    return author
