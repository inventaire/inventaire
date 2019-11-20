const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = {
  getAlreadyResolvedUris: seed => _.compact(_.map(seed, 'uri')),

  someTermsMatch: seedTerms => {
    return entity => {
      const entityTerms = getEntityNormalizedTerms(entity)
      return _.someMatch(seedTerms, entityTerms)
    }
  },

  resolveSeed: seed => {
    return entities => {
    // When only one entity is found, then seed is considered resolved
      if (entities.length === 1) { seed.uri = entities[0].uri }
      return seed
    }
  }
}
