const CONFIG = require('config')
const __ = CONFIG.universalPath
const Item = require('models/item')
const db = require('db/couchdb/base')('items')

// Working around the circular dependency
let items_
const lateRequire = () => { items_ = require('./items') }
setTimeout(lateRequire, 0)

const AfterFn = (viewName, modelFnName) => async (fromUri, toUri) => {
  const items = await items_[viewName](fromUri)
  const updatedItems = items.map(Item[modelFnName].bind(null, fromUri, toUri))
  return db.bulk(updatedItems)
}

module.exports = {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity')
}
