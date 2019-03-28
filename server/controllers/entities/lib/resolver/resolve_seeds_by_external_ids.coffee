CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveExternalIds = require './resolve_external_ids'

module.exports = (seeds)->
  seeds.map (seed)->
    resolveExternalIds seed.claims
    .then (uris)->
      unless uris? then return seed
      if uris.length is 1 then seed.uri = uris[0]
      seed
