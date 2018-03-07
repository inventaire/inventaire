__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
Entity = __.require 'models', 'entity'

module.exports = (userId, fromUri, toUri)->
  entities_.byClaimsValue fromUri
  .then (results)->
    entitiesToEditIds = _.map results, 'entity'
    _.log entitiesToEditIds, 'entitiesToEditIds'
    if entitiesToEditIds.length is 0 then return
    # Doing all the redirects at once to avoid conflicts
    # within a same entity pointing several times to the redirected entity.
    # There is no identified case at the moment though.
    entities_.byIds entitiesToEditIds
    .then (entities)->
      entitiesIndex = _.indexBy entities, '_id'
      entitiesIndexBeforeUpdate = _.cloneDeep entitiesIndex
      # Apply all the redirection updates on the entities docs
      results.forEach (result)->
        { entity, property } = result
        doc = entitiesIndex[entity]

        # If the toUri is already a claim value, delete the fromUri claim
        # instead of creating a duplicated claim
        if toUri in doc.claims[property] then newVal = null
        else newVal = toUri

        entitiesIndex[entity] = Entity.updateClaim doc, property, fromUri, newVal

      # Then, post the updates all at once
      updatesPromises = _.values(entitiesIndex).map (updatedDoc)->
        currentDoc = entitiesIndexBeforeUpdate[updatedDoc._id]
        return entities_.putUpdate { userId, currentDoc, updatedDoc }

      return promises_.all updatesPromises
