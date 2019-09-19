CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports =
  getAlreadyResolvedUris: (seed)-> _.compact _.map(seed, 'uri')

  ifSomeLabelsMatch: (seedLabels)-> (entity)->
    entitiesLabels = _.values entity.labels
    _.intersection(seedLabels, entitiesLabels).length > 0

  getLabels: (seed)-> _.values seed.labels

  resolveSeed: (seed)-> (entities)->
    # When only one entity is found, then seed is considered resolved
    if entities.length is 1 then seed.uri = entities[0].uri
    return seed
