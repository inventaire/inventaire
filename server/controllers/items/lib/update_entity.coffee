CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Item = __.require 'models', 'item'
items_ = require './items'

AfterFn = (viewName, modelFnName)-> (fromUri, toUri)->
  items_[viewName](fromUri)
  .map (item)->
    updater = Item[modelFnName].bind null, fromUri, toUri
    return items_.db.update item._id, updater

module.exports =
  afterMerge: AfterFn 'byEntity', 'updateEntityAfterEntityMerge'
  afterRevert: AfterFn 'byPreviousEntity', 'updateEntityAfterEntityMergeRevert'
