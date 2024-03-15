import { getItemsByEntity, getItemsByPreviousEntity } from '#controllers/items/lib/items'
import dbFactory from '#db/couchdb/base'
import { revertItemDocEntity, updateItemDocEntity } from '#models/item'

const db = await dbFactory('items')

const AfterFn = (viewName, modelFn) => async (fromUri, toUri) => {
  let items
  if (viewName === 'byPreviousEntity') {
    items = await getItemsByPreviousEntity(fromUri)
  } else {
    items = await getItemsByEntity(fromUri)
  }
  const updatedItems = items.map(modelFn.bind(null, fromUri, toUri))
  return db.bulk(updatedItems)
}

export default {
  afterMerge: AfterFn('byEntity', updateItemDocEntity),
  afterRevert: AfterFn('byPreviousEntity', revertItemDocEntity),
}
