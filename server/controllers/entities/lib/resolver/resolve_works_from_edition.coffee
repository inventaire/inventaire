CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require './helpers'
entities_ = require '../entities'
getEntitiesList = require '../get_entities_list'
getEntityByUri = require '../get_entity_by_uri'
{ getEntityNormalizedTerms } = require '../terms_normalization'

module.exports = (worksSeeds, editionSeed)->
  unless editionSeed.uri? then return Promise.resolve worksSeeds

  getEntityByUri { uri: editionSeed.uri }
  .then (editionEntity)->
    unless editionEntity? then return worksSeeds
    worksUris = editionEntity.claims['wdt:P629']
    getEntitiesList worksUris
    .then (worksEntities)-> worksSeeds.map resolveWork(worksEntities)

resolveWork = (worksEntities)-> (workSeed)->
  workSeedTerms = getEntityNormalizedTerms workSeed
  matchingWorks = worksEntities.filter(someTermsMatch(workSeedTerms))
  return resolveSeed(workSeed)(matchingWorks)
