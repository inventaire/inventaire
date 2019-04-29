__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
Entity = __.require 'models', 'entity'
getEntityType = require './get_entity_type'
typesWithoutLabels = require './types_without_labels'

module.exports = (lang, value, userId, currentDoc)->
  checkEntityTypeCanHaveLabel currentDoc

  updatedDoc = _.cloneDeep currentDoc
  updatedDoc = Entity.setLabel updatedDoc, lang, value
  return entities_.putUpdate { userId, currentDoc, updatedDoc }

checkEntityTypeCanHaveLabel = (currentDoc)->
  type = getEntityType currentDoc.claims

  if type in typesWithoutLabels
    throw error_.new "#{type}s can't have labels", 400
