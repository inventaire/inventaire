import dbFactory from '#db/couchdb/base'
import Item from '#models/item'

const db = await dbFactory('items')

let getItemsByEntity, getItemsByPreviousEntity
const importCircularDependencies = async () => {
  ({ getItemsByEntity, getItemsByPreviousEntity } = await import('./items.js'))
}
setImmediate(importCircularDependencies)

const AfterFn = (viewName, modelFnName) => async (fromUri, toUri) => {
  let items
  if (viewName === 'byPreviousEntity') {
    items = await getItemsByPreviousEntity(fromUri)
  } else {
    items = await getItemsByEntity(fromUri)
  }
  const updatedItems = items.map(Item[modelFnName].bind(null, fromUri, toUri))
  return db.bulk(updatedItems)
}

export default {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity'),
}
