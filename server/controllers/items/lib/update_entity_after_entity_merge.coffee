CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Item = __.require 'models', 'item'
items_ = require './items'

module.exports = (fromUri, toUri)->
  items_.byEntity fromUri
  .map (item)->
    updater = Item.updateEntityAfterEntityMerge.bind null, fromUri, toUri
    return items_.db.update item._id, updater
