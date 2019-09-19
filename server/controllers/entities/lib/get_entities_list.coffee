CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require './get_entities_by_uris'

# A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
# ex: getSomeUris.then(getEntitiesList)

module.exports = (uris)->
  unless uris? then return Promise.resolve []
  getEntitiesByUris { uris, list: true }
