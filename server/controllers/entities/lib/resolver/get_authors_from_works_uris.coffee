CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require '../get_entities_by_uris'

module.exports = (workUris, authorSeedLabels)->
  getEntities workUris
  .then getAuthorUris
  .then _.flatten
  .then getEntities
  .filter (author)->
    authorEntityLabels = _.values author.labels
    _.intersection(authorSeedLabels, authorEntityLabels).length > 0

getAuthorUris = (works)->
  works.map (work)-> work.claims['wdt:P50']

getEntities = (uris)->
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
