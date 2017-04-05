__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'

module.exports = (req, res, next) ->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  { body:item } = req

  _.log item, 'item create'

  { entity:entityUri } = item
  unless entityUri? then return error_.bundleMissingBody req, res, 'entity'

  unless _.isEntityUri entityUri
    return error_.bundleInvalid req, res, 'entity', entityUri

  reqUserId = req.user._id
  itemId = item._id

  snapshotTitleFromEntity item, entityUri
  .then items_.create.bind(null, reqUserId)
  .then (item)-> res.status(201).json item
  .tap Track(req, ['item', 'creation'])
  .catch error_.Handler(req, res)

snapshotTitleFromEntity = (item, entityUri)->
  getEntityByUri entityUri
  .then (entity)->
    { type } = entity
    unless type in whitelistedTypes
      throw error_.new 'invalid entity type', 400, item

    # TODO: also snapshot series label and rank when available
    return findTitleFromEntity[type](item, entity)

findTitleFromEntity =
  edition: (item, entity)->
    title = entity.claims['wdt:P1476']?[0]
    unless _.isNonEmptyString title
      throw error_.new 'no title found on edition', 400, item

    return addTitle item, title

  work: (item, entity)->
    { lang } = item
    unless _.isLang lang
      message = "can't deduce title from a work entity without a lang"
      throw error_.new message, 400, arguments

    title = entity.labels[lang]
    unless _.isNonEmptyString title
      throw error_.new 'no title could be found on the work entity', 400, item

    return addTitle item, title


whitelistedTypes = Object.keys findTitleFromEntity

addTitle = (item, title)->
  item.snapshot = { 'entity:title': title }
  return item
