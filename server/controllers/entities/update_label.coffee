__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'
radio = __.require 'lib', 'radio'
Entity = __.require 'models', 'entity'
getEntityType = require './lib/get_entity_type'
typesWithoutLabels = require './lib/types_without_labels'

module.exports = (req, res)->
  { id:entityId, lang, value } = req.body
  { _id:reqUserId } = req.user

  _.log req.body, 'update label body'

  unless entityId? then return error_.bundleMissingBody req, res, 'id'
  unless lang? then return error_.bundleMissingBody req, res, 'lang'
  unless value?.trim() then return error_.bundleMissingBody req, res, 'value'

  value = value.trim()

  unless _.isInvEntityId entityId
    return error_.bundleInvalid req, res, 'id', entityId

  unless _.isLang lang
    return error_.bundleInvalid req, res, 'lang', lang

  unless _.isNonEmptyString value
    return error_.bundleInvalid req, res, 'value', value

  entities_.byId entityId
  .then updateLabel(lang, value, reqUserId)
  .tap _.Ok(res)
  .then (updatedDoc)-> radio.emit 'entity:update:label', updatedDoc, lang, value
  .catch error_.Handler(req, res)

updateLabel = (lang, value, userId)-> (currentDoc)->
  checkEntityTypeCanHaveLabel currentDoc

  updatedDoc = _.cloneDeep currentDoc
  updatedDoc = Entity.setLabel updatedDoc, lang, value
  return entities_.putUpdate userId, currentDoc, updatedDoc

checkEntityTypeCanHaveLabel = (currentDoc)->
  type = getEntityType currentDoc.claims['wdt:P31']

  if type in typesWithoutLabels
    throw error_.new "#{type}s can't have labels", 400
