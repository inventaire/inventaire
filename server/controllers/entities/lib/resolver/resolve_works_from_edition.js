const { someTermsMatch, resolveSeed } = require('./helpers')
const getEntitiesList = require('../get_entities_list')
const getEntityByUri = require('../get_entity_by_uri')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = async (worksSeeds, editionSeed) => {
  if (editionSeed.uri == null) return worksSeeds

  const editionEntity = await getEntityByUri({ uri: editionSeed.uri })
  if (editionEntity == null) return worksSeeds
  const worksUris = editionEntity.claims['wdt:P629']
  const worksEntities = await getEntitiesList(worksUris)
  return worksSeeds.map(resolveWork(worksEntities))
}

const resolveWork = worksEntities => workSeed => {
  const workSeedTerms = getEntityNormalizedTerms(workSeed)
  const matchingWorks = worksEntities.filter(someTermsMatch(workSeedTerms))
  return resolveSeed(workSeed)(matchingWorks)
}
