CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getEntitiesByUris = require '../get_entities_by_uris'
{ Promise } = __.require 'lib', 'promises'

module.exports = (workUris, authorLabels)->
  getEntitiesByUris { uris: workUris }
  .get 'entities'
  .then _.values
  .then (works)->
    authorClaims = works.map (work)-> work.claims['wdt:P50']
    authorUris = _.flatten authorClaims
  .then (uris)-> getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
  .filter (existingAuthor)->
    authorsLabels = Object.values(existingAuthor.labels)
    _.intersection(authorLabels, authorsLabels).length > 0
