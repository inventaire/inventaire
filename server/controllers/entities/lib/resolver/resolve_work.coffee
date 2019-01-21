CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'
resolveExternalIds = require './resolve_external_ids'

module.exports = (work)->
  resolveExternalIds work.claims
  .then (uris)->
    unless uris then return work
    if uris.length is 1 then work.uri = uris[0]
    return work
