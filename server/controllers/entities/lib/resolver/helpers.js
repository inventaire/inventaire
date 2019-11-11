// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = {
  getAlreadyResolvedUris(seed){ return _.compact(_.map(seed, 'uri')) },

  someTermsMatch(seedTerms){ return function(entity){
    const entityTerms = getEntityNormalizedTerms(entity)
    return _.someMatch(seedTerms, entityTerms)
  } },

  resolveSeed(seed){ return function(entities){
    // When only one entity is found, then seed is considered resolved
    if (entities.length === 1) { seed.uri = entities[0].uri }
    return seed
  } }
}
