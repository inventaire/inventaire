const _ = require('builders/utils')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = {
  getAlreadyResolvedUris: seed => _.compact(_.map(seed, 'uri')),

  someTermsMatch: seedTerms => entity => {
    const entityTerms = getEntityNormalizedTerms(entity).map(_.toLowerCase)
    return _.someMatch(serializeStrings(seedTerms), serializeStrings(entityTerms))
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
const serializeStrings = strings => {
  return strings.map(str => {
    const lowerStr = _.toLowerCase(str)
    // avoid mismatch such:
    // 'Willing slaves of capital : Spinoza and Marx on desire'
    // 'Willing slaves of capital: Spinoza and Marx on desire'
    return lowerStr.replace(/ /g, '')
    // superTrim
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '')
    .replace(/\s+/g, ' ')
  })
}
