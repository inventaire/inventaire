# Use hooks to infer entity updates from other entity updates
# Ex: update the label of a work when one of its

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
getEntityType = require './get_entity_type'
keepWorkLabelAndEditionTitleInSync = require './keep_work_label_and_edition_title_in_sync'

module.exports = -> radio.on 'entity:update:claim', claimUpdateHooks

claimUpdateHooks = (updatedDoc, property, oldVal, newVal)->
  type = getEntityType updatedDoc.claims['wdt:P31']
  if type is 'edition'
    if property is 'wdt:P1476'
      keepWorkLabelAndEditionTitleInSync updatedDoc, oldVal
