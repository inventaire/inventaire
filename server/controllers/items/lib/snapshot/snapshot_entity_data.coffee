__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
buildSnapshot = require './build_snapshot'
{ getEditionGraphFromEdition, getWorkGraphFromWork } = require './get_entities'

module.exports = (item, entityUri)->
  getEntityByUri entityUri
  .then (entity)->
    { type } = entity
    unless type in whitelistedTypes
      throw error_.new 'invalid entity type', 400, item

    # TODO: also snapshot series label and rank when available
    return snapshotByType[type](item, entity)

snapshotByType =
  edition: (item, edition)->
    getEditionGraphFromEdition edition
    .spread buildSnapshot.edition
    .then addSnapshot(item)

  work: (item, work)->
    { lang } = item
    unless _.isLang lang
      message = "can't deduce title from a work entity without a lang"
      throw error_.new message, 400, arguments

    getWorkGraphFromWork lang, work
    .spread buildSnapshot.work
    .then addSnapshot(item)

addSnapshot = (item)-> (snapshot)->
  item.snapshot = snapshot
  return item

whitelistedTypes = Object.keys snapshotByType
