# Entity data snapshots are a attributes of the snapshot object on item documents:
# - entity:title
# - entity:lang
# - entity:authors
# - entity:series
# - entity:image
# - entity:ordinal

# Their role is to keep a copy at hand of data deduced from the item's entity
# and its graph: typically, the edition the item is an instance of, the edition work,
# (or works in case of a multi-works edition), the work(s) authors, the serie(s)
# the work(s) might be part of.
# Being able to have a succint version of those data accessible from the item
# allows to display basic data or filter large lists of items by text
# without having to query from 3 to 10+ entities per item

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
buildSnapshot = require './build_snapshot'
{ getEditionGraphFromEdition, getWorkGraphFromWork } = require './get_entities'
Item = __.require 'models', 'item'

module.exports = (item)->
  getEntityByUri item.entity
  .then (entity)->
    { type } = entity
    unless type in whitelistedTypes
      throw error_.new 'invalid entity type', 400, item

    return snapshotByType[type](item, entity)

snapshotByType =
  edition: (item, edition)->
    getEditionGraphFromEdition edition
    .spread buildSnapshot.edition
    .then Item.updateSnapshot.bind(null, item)

  work: (item, work)->
    { lang } = item
    unless _.isLang lang
      message = "can't deduce title from a work entity without a lang"
      throw error_.new message, 400, arguments

    getWorkGraphFromWork lang, work
    .spread buildSnapshot.work
    .then Item.updateSnapshot.bind(null, item)

whitelistedTypes = Object.keys snapshotByType
