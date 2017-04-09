__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ Promise } = __.require 'lib', 'promises'

getEditionWork = (edition)->
  getEntityByUri edition.claims['wdt:P629'][0]

getWorkAuthors = (work)->
  authorsUris = work.claims['wdt:P50']
  unless authorsUris?.length > 0 then return Promise.resolve []
  Promise.all authorsUris.map(getEntityByUri)

getEditionGraphFromEdition = (edition)->
  getEditionWork edition
  .then (work)->
    getWorkAuthors work
    # Tailor output to be spreaded on buildSnapshot.edition
    .then (authors)-> [ edition, work, authors ]

getEditionGraphEntities = (uri)->
  getEntityByUri uri
  .then getEditionGraphFromEdition

getWorkGraphFromWork = (lang, work)->
  getWorkAuthors work
  .then (authors)-> [ lang, work, authors ]

module.exports = {
  getWorkAuthors,
  getEditionGraphFromEdition,
  getEditionGraphEntities,
  getWorkGraphFromWork,
}
