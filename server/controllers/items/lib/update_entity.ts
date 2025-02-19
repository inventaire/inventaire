import { getItemsByEntity, getItemsByPreviousEntity } from '#controllers/items/lib/items'
import { dbFactory } from '#db/couchdb/base'
import type { EntityUri } from '#types/entity'

const db = await dbFactory('items')

export async function updateItemsEntityAfterMerge (currentUri: EntityUri, newUri: EntityUri) {
  const items = await getItemsByEntity(currentUri)
  for (const item of items) {
    item.entity = newUri
    // Keeping track of previous entity URI in case of a revert merge
    item.previousEntities ??= []
    item.previousEntities.unshift(currentUri)
  }
  return db.bulk(items)
}

export async function updateItemsEntityAfterMergeRevert (revertedUri: EntityUri) {
  const items = await getItemsByPreviousEntity(revertedUri)
  for (const item of items) {
    item.entity = revertedUri
    // Keep only the uris associated to that item before the currently reverted merge,
    // in the rather unlikely case (but seen to happen in prod) were an entity was redirected several times
    const revertedUriIndex = item.previousEntities.indexOf(revertedUri)
    item.previousEntities = item.previousEntities.splice(revertedUriIndex + 1)
    if (item.previousEntities.length === 0) delete item.previousEntities
  }
  return db.bulk(items)
}
