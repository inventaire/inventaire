CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Item = __.require 'models', 'item'

# Working around circular dependencies
items_ = null
lateRequire = -> items_ = require './items'
setTimeout lateRequire, 0

AfterFn = (viewName, modelFnName)-> (fromUri, toUri)->
  items_[viewName](fromUri)
  .map Item[modelFnName].bind(null, fromUri, toUri)
  .then items_.db.bulk

module.exports =
  afterMerge: AfterFn 'byEntity', 'updateEntity'
  afterRevert: AfterFn 'byPreviousEntity', 'revertEntity'
