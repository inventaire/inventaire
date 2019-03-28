CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = require '../get_entities_by_uris'

module.exports  = (authorUris)->
  Promise.all authorUris.map(getWorksFromAuthorsUri)
  .then _.flatten

getWorksFromAuthorsUri = (authorUri)->
  getAuthorWorks { uri: authorUri }
  .get 'works'
  .map _.property('uri')
  # get full-fledged entity, as getAuthorWorks returns an entity without labels
  .then getEntities

getEntities = (uris)->
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
