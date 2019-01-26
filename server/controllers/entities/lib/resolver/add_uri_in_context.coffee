CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

module.exports = (contextEntities, getFromUris)-> (entity)->
  # Return if entity is already resolved
  # or if no resolved context is found
  if entity.uri? or _.isEmpty(contextEntities) then return

  contextUris = _.compact _.map(contextEntities, 'uri')
  entryEntityLabels = _.values(entity.labels)

  Promise.all getFromUris(contextUris, entryEntityLabels)
  .then _.flatten
  .then _.uniq
  .then (entities)->
    # Only one entity found, then it must match entry entity
    if entities.length is 1
      entity.uri = entities[0].uri
