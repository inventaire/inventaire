__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
{ Promise } = __.require 'lib', 'promises'
snapshotEntityData = require './lib/snapshot/snapshot_entity_data'

module.exports = (req, res, next)->
  { body:items } = req

  singleItemMode = _.isPlainObject items

  items = _.forceArray items

  _.log items, 'create items'

  for item in items
    { entity:entityUri } = item
    unless entityUri? then return error_.bundleMissingBody req, res, 'entity'

    unless _.isEntityUri entityUri
      return error_.bundleInvalid req, res, 'entity', entityUri

  reqUserId = req.user._id

  Promise.all items.map(createItem(reqUserId))
  .then (items)->
    # When only one item was sent, without being wrapped in an array
    # return the created item object, instead of an array
    data = if singleItemMode then items[0] else items
    res.status(201).json data
  .tap Track(req, ['item', 'creation'])
  .catch error_.Handler(req, res)

createItem = (reqUserId)-> (itemData)->
  snapshotEntityData itemData, itemData.entity
  .then items_.create.bind(null, reqUserId)
