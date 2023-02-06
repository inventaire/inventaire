import { compact, map } from 'lodash-es'
import { someMatch } from '#lib/utils/base'
import { getEntityNormalizedTerms } from '../terms_normalization.js'

export const getAlreadyResolvedUris = seed => compact(map(seed, 'uri'))

export const someTermsMatch = seed => {
  const seedTerms = getEntityNormalizedTerms(seed)
  return entity => {
    const entityTerms = getEntityNormalizedTerms(entity)
    return someMatch(seedTerms, entityTerms)
  }
}

export const resolveSeed = (seed, expectedEntityType) => entities => {
  // When only one entity is found, then seed is considered resolved
  // at the condition that it does have the expected type
  if (entities.length === 1) {
    const entity = entities[0]
    if (expectedEntityType) {
      if (expectedEntityType === entity.type) seed.uri = entity.uri
    } else {
      seed.uri = entity.uri
    }
  }
  return seed
}
