__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ Promise } = __.require 'lib', 'promises'
{ aggregateClaims } = require './helpers'

# Pluralize works to account for composite editions
getEditionWorks = (edition)->
  Promise.all edition.claims['wdt:P629'].map(getEntityByUri)

getWorkRelativeEntity = (relationProperty)-> (work)->
  uris = work.claims[relationProperty]
  unless uris?.length > 0 then return Promise.resolve []
  return Promise.all uris.map(getEntityByUri)

getWorkAuthors = getWorkRelativeEntity 'wdt:P50'
getWorkSeries = getWorkRelativeEntity 'wdt:P179'

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
