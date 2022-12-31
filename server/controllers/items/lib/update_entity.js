import Item from 'models/item'
import dbFactory from 'db/couchdb/base'
const db = dbFactory('items')

let items_
const requireCircularDependencies = () => { items_ = require('./items') }
setImmediate(requireCircularDependencies)

const AfterFn = (viewName, modelFnName) => async (fromUri, toUri) => {
  const items = await items_[viewName](fromUri)
  const updatedItems = items.map(Item[modelFnName].bind(null, fromUri, toUri))
  return db.bulk(updatedItems)
}

export default {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity')
}
