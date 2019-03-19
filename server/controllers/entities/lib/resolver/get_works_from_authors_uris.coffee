CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = require '../get_entities_by_uris'

module.exports  = (authorUris, workSeedLabels)->
  Promise.all authorUris.map getWorksFromAuthorsUri(workSeedLabels)
  .then _.flatten
  .then _.uniq

getWorksFromAuthorsUri = (workSeedLabels)-> (authorUri)->
  getAuthorWorks { uri: authorUri }
  .get 'works'
  .map _.property('uri')
  # fetch full-fledged entity, as getAuthorWorks returns an incomplete entity
  .then getEntities
  .filter (work)-> matchSeedLabels(work, workSeedLabels)

matchSeedLabels = (work, workSeedLabels)->
  worksEntitiesLabels = _.values work.labels
  _.intersection(workSeedLabels, worksEntitiesLabels).length > 0

getEntities = (uris)->
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
