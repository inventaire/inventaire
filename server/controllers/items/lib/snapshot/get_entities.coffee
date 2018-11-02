__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
{ Promise } = __.require 'lib', 'promises'
{ aggregateClaims } = require './helpers'

getRelativeEntities = (relationProperty)-> (work)->
  uris = work.claims[relationProperty]
  unless uris?.length > 0 then return Promise.resolve []
  getEntitiesByUris uris
  .then (res)-> _.values(res.entities)

getEditionWorks = getRelativeEntities 'wdt:P629'
getWorkAuthors = getRelativeEntities 'wdt:P50'
getWorkSeries = getRelativeEntities 'wdt:P179'

getWorkAuthorsAndSeries = (work)->
  Promise.all [
    getWorkAuthors work
    getWorkSeries work
  ]

getEditionGraphFromEdition = (edition)->
  getEditionWorks edition
  .then (works)->
    _.type works, 'array'
    getWorksAuthorsAndSeries works
    # Tailor output to be spreaded on buildSnapshot.edition
    .spread (authors, series)-> [ edition, works, authors, series ]

getWorksAuthorsAndSeries = (works)->
  mergedWorks = { claims: mergeWorksClaims(works) }
  return getWorkAuthorsAndSeries mergedWorks

# Aggregating edition's potentially multiple works claims to fit
# dependent functions' needs
mergeWorksClaims = (works)->
  'wdt:P50': aggregateClaims works, 'wdt:P50'
  'wdt:P179': aggregateClaims works, 'wdt:P179'

getEditionGraphEntities = (uri)->
  getEntityByUri uri
  .then getEditionGraphFromEdition

getWorkGraphFromWork = (lang, work)->
  getWorkAuthorsAndSeries work
  .spread (authors, series)-> [ lang, work, authors, series ]

module.exports = {
  getWorkAuthorsAndSeries
  getEditionGraphFromEdition,
  getEditionGraphEntities,
  getWorkGraphFromWork,
}
