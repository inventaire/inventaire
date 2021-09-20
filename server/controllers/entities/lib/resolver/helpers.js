const _ = require('builders/utils')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = {
  getAlreadyResolvedUris: seed => _.compact(_.map(seed, 'uri')),

  someTermsMatch: seedTerms => {
    return entity => {
      const entityTerms = getEntityNormalizedTerms(entity)
      return _.someMatch(seedTerms, entityTerms)
    }
  },

  resolveSeed: (seed, expectedEntityType) => entities => {
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
}
