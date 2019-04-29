# Infer entity updates from other entity updates
# Ex: see if a work label should be updated after one of its editions
# got it's title updated

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityType = require './get_entity_type'
promises_ = __.require 'lib', 'promises'
keepWorkLabelAndEditionTitleInSync = require './keep_work_label_and_edition_title_in_sync'

module.exports = (updatedDoc, property, oldVal)->
  type = getEntityType updatedDoc.claims
  if type is 'edition'
    if property is 'wdt:P1476'
      return keepWorkLabelAndEditionTitleInSync updatedDoc, oldVal

  return
