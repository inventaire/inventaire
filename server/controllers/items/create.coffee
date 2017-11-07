__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
{ Promise } = __.require 'lib', 'promises'

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

  items_.create reqUserId, items
  .then (itemsDocs)->
    # When only one item was sent, without being wrapped in an array
    # return the created item object, instead of an array
    data = if singleItemMode then itemsDocs[0] else itemsDocs
    res.status(201).json data
  .tap Track(req, [ 'item', 'creation', null, items.length ])
  .catch error_.Handler(req, res)
