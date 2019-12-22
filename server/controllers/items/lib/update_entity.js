const CONFIG = require('config')
const __ = CONFIG.universalPath
const Item = __.require('models', 'item')
const db = __.require('couch', 'base')('items')

// Working around the circular dependency
let items_
const lateRequire = () => { items_ = require('./items') }
setTimeout(lateRequire, 0)

const AfterFn = (viewName, modelFnName) => (fromUri, toUri) => {
  return items_[viewName](fromUri)
  .map(Item[modelFnName].bind(null, fromUri, toUri))
  .then(db.bulk)
}

module.exports = {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity')
}
