__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ Promise } = __.require 'lib', 'promises'

getEditionWork = (edition)->
  getEntityByUri edition.claims['wdt:P629'][0]

getWorkRelativeEntity = (relationProperty)-> (work)->
  _.warn work, 'work'
  uris = work.claims[relationProperty]
  _.log uris, "#{relationProperty} uris"
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
  getEditionWork edition
  .then (work)->
    getWorkAuthorsAndSeries work
    # Tailor output to be spreaded on buildSnapshot.edition
    .spread (authors, series)-> [ edition, work, authors, series ]

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
