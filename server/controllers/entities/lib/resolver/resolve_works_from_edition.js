// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { Promise } = __.require('lib', 'promises')
const { someTermsMatch, resolveSeed } = require('./helpers')
const getEntitiesList = require('../get_entities_list')
const getEntityByUri = require('../get_entity_by_uri')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = (worksSeeds, editionSeed) => {
  if (editionSeed.uri == null) return Promise.resolve(worksSeeds)

  return getEntityByUri({ uri: editionSeed.uri })
  .then(editionEntity => {
    if (editionEntity == null) return worksSeeds
    const worksUris = editionEntity.claims['wdt:P629']
    return getEntitiesList(worksUris)
    .then(worksEntities => worksSeeds.map(resolveWork(worksEntities)))
  })
}

const resolveWork = worksEntities => workSeed => {
  const workSeedTerms = getEntityNormalizedTerms(workSeed)
  const matchingWorks = worksEntities.filter(someTermsMatch(workSeedTerms))
  return resolveSeed(workSeed)(matchingWorks)
}
