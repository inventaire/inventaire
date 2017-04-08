__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
Item = __.require 'models', 'item'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
authors_ = require './authors'

module.exports = (item, entityUri)->
  getEntityByUri entityUri
  .then (entity)->
    { type } = entity
    unless type in whitelistedTypes
      throw error_.new 'invalid entity type', 400, item

    # TODO: also snapshot series label and rank when available
    return snapshotByType[type](item, entity)

snapshotByType =
  edition: (item, entity)->
    title = entity.claims['wdt:P1476']?[0]
    unless _.isNonEmptyString title
      throw error_.new 'no title found on edition', 400, item

    # Assumes that all editions have an associated work
    workUri = entity.claims['wdt:P629'][0]
    lang = getOriginalLang(entity.claims) or 'en'

    getEntityByUri workUri
    .then (workEntity)-> authors_.getNames workEntity.claims['wdt:P50'], lang
    .then addSnapshot(item, title)

  work: (item, entity)->
    { lang } = item
    unless _.isLang lang
      message = "can't deduce title from a work entity without a lang"
      throw error_.new message, 400, arguments

    title = entity.labels[lang]
    unless _.isNonEmptyString title
      throw error_.new 'no title could be found on the work entity', 400, item

    authors_.getNames entity.claims['wdt:P50'], lang
    .then addSnapshot(item, title)

whitelistedTypes = Object.keys snapshotByType

addSnapshot = (item, title)-> (authorsNamesString)->
  item.snapshot =
    'entity:title': title
    'entity:authors': authorsNamesString
  return item
