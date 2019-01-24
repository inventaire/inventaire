CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require 'lib', 'get_best_lang_value'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = require '../get_entities_by_uris'
{ Promise } = __.require 'lib', 'promises'

module.exports = (uris, authorLabels)->
  getEntitiesByUris { uris }
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
