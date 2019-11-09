CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ getEntityNormalizedTerms } = require '../terms_normalization'

module.exports =
  getAlreadyResolvedUris: (seed)-> _.compact _.map(seed, 'uri')

  someTermsMatch: (seedTerms)-> (entity)->
    entityTerms = getEntityNormalizedTerms entity
    return _.someMatch seedTerms, entityTerms

  resolveSeed: (seed)-> (entities)->
    # When only one entity is found, then seed is considered resolved
    if entities.length is 1 then seed.uri = entities[0].uri
    return seed
