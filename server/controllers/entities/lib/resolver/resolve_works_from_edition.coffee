CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ getAlreadyResolvedUris, ifSomeLabelsMatch, getLabels, resolveSeed } = require './helpers'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntitiesList = require '../get_entities_list'

module.exports = (worksSeeds, editionSeed)->
  unless editionSeed.uri? then return Promise.resolve worksSeeds

  getEntityByUri { uri: editionSeed.uri }
  .then (editionEntity)->
    worksUris = editionEntity.claims['wdt:P629']
    getEntitiesList worksUris
  .then (worksEntities)-> worksSeeds.map resolveWork(worksEntities)

resolveWork = (worksEntities)-> (workSeed)->
  workSeedLabels = getLabels workSeed
  matchingWorks = worksEntities.filter(ifSomeLabelsMatch(workSeedLabels))
  return resolveSeed(workSeed)(matchingWorks)
