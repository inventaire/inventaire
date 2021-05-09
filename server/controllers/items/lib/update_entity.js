const Item = require('models/item')
const db = require('db/couchdb/base')('items')

let items_
const requireCircularDependencies = () => { items_ = require('./items') }
setImmediate(requireCircularDependencies)

const AfterFn = (viewName, modelFnName) => async (fromUri, toUri) => {
  const items = await items_[viewName](fromUri)
  const updatedItems = items.map(Item[modelFnName].bind(null, fromUri, toUri))
  return db.bulk(updatedItems)
}

module.exports = {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity')
}
