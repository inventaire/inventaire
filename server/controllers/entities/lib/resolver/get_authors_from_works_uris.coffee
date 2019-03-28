CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require '../get_entities_by_uris'

module.exports = (workUris)->
  getEntities workUris
  .then getAuthorUris
  .then _.flatten
  .then getEntities

getAuthorUris = (works)->
  works.map (work)-> work.claims['wdt:P50']

getEntities = (uris)->
  unless uris? then return []
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
