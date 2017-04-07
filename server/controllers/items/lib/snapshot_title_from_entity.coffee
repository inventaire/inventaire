__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
Item = __.require 'models', 'item'

module.exports = (item, entityUri)->
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

    return Item.updateSnapshotTitle title, item

  work: (item, entity)->
    { lang } = item
    unless _.isLang lang
      message = "can't deduce title from a work entity without a lang"
      throw error_.new message, 400, arguments

    title = entity.labels[lang]
    unless _.isNonEmptyString title
      throw error_.new 'no title could be found on the work entity', 400, item

    return Item.updateSnapshotTitle title, item

whitelistedTypes = Object.keys findTitleFromEntity
