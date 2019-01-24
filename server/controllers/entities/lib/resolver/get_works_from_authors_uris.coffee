CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = require '../get_entities_by_uris'

module.exports  = (authorUris, workLabels)->
  authorUris.map (uri)->
    getAuthorWorks { uri }
    .get 'works'
    .map _.property('uri')
    .then (uris)-> getEntitiesByUris({ uris })
    .get 'entities'
    .then _.values
    .filter (existingWork)->
      worksLabels = Object.values(existingWork.labels)
      _.intersection(workLabels, worksLabels).length > 0
