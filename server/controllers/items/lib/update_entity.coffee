CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Item = __.require 'models', 'item'

# Working around circular dependencies
snapshotEntityData = null
items_ = null

lateRequire = ->
  snapshotEntityData = require './snapshot/snapshot_entity_data'
  items_ = require './items'

setTimeout lateRequire, 0

AfterFn = (viewName, modelFnName)-> (fromUri, toUri)->
  items_[viewName](fromUri)
  .map Item[modelFnName].bind(null, fromUri, toUri)
  .map (item)-> snapshotEntityData item, item.entity
  .then items_.db.bulk

module.exports =
  afterMerge: AfterFn 'byEntity', 'updateEntity'
  afterRevert: AfterFn 'byPreviousEntity', 'revertEntity'
