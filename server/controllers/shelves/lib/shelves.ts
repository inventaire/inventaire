import { compact, difference, flatMap, map, pick, property, uniq } from 'lodash-es'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getAuthorizedItemsByShelves } from '#controllers/items/lib/get_authorized_items'
import { getItemsByIds, itemsBulkDelete, updateItemsShelves } from '#controllers/items/lib/items'
import dbFactory from '#db/couchdb/base'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { forceArray } from '#lib/utils/base'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import shelfAttributes from '#models/attributes/shelf'
import { createShelfDoc, updateShelfDocAttributes } from '#models/shelf'
import type { NewCouchDoc } from '#types/couchdb'
import type { Item } from '#types/item'
import type { NewShelf, Shelf, ShelfWithItems } from '#types/shelf'

const { updatable } = shelfAttributes

const db = await dbFactory('shelves')

export async function createShelf (newShelf: NewShelf) {
  const shelf = createShelfDoc(newShelf)
  await validateVisibilityKeys(shelf.visibility, shelf.owner)
  return db.postAndReturn(shelf as NewCouchDoc<Shelf>)
}

export const getShelfById = db.get<Shelf>

export const getShelvesByIds = db.byIds<Shelf>

export async function getShelvesByIdsWithItems (ids, reqUserId) {
  const shelves = await getShelvesByIds(ids)
  const shelvesCount = compact(shelves).length
  if (shelvesCount === 0) return []
  let items = await getAuthorizedItemsByShelves(shelves, reqUserId)
  items = items.map(filterPrivateAttributes(reqUserId))
  return assignItemsToShelves(shelves, items)
}

export function getShelvesByOwners (ownersIds) {
  return db.getDocsByViewKeys<Shelf>('byOwner', ownersIds)
}

export async function updateShelfAttributes (params) {
  const { shelfId, reqUserId } = params
  const newAttributes = pick(params, updatable)
  if (newAttributes.visibility) {
    await validateVisibilityKeys(newAttributes.visibility, reqUserId)
  }
  const shelf = await db.get<Shelf>(shelfId)
  const updatedShelf = updateShelfDocAttributes(shelf, newAttributes, reqUserId)
  return db.putAndReturn(updatedShelf)
}

export async function addItemsToShelves (shelvesIds, itemsIds, userId) {
  const docs = await updateShelvesItems('addShelves', shelvesIds, userId, itemsIds)
  await emit('shelves:update', shelvesIds)
  return docs
}

export function removeItemsFromShelves (shelvesIds, itemsIds, userId) {
  return updateShelvesItems('deleteShelves', shelvesIds, userId, itemsIds)
}

export async function bulkDeleteShelves (shelves) {
  if (shelves.length === 0) return
  await db.bulkDelete(shelves)
  const reqUserId = shelves[0].owner
  const shelvesIds = map(shelves, '_id')
  const shelvesItems = await getAuthorizedItemsByShelves(shelves, reqUserId)
  const itemsIds = map(shelvesItems, '_id')
  await updateItemsShelves('deleteShelves', shelvesIds, reqUserId, itemsIds)
}

export async function deleteShelvesItems (shelves) {
  const itemsIds = uniq(flatMap(shelves, 'items'))
  const docs = await getItemsByIds(itemsIds).then(compact)
  await itemsBulkDelete(docs)
  return docs
}

export function validateShelfOwnership (userId, shelves) {
  shelves = forceArray(shelves)
  for (const shelf of shelves) {
    if (shelf.owner !== userId) {
      throw newError('wrong owner', 403, { userId, shelfId: shelf._id })
    }
  }
}

export function deleteUserShelves (userId) {
  return db.getDocsByViewKeys<Shelf>('byOwner', [ userId ])
  .then(db.bulkDelete)
}

async function updateShelvesItems (action, shelvesIds, userId, itemsIds) {
  const shelves = await getShelvesByIds(shelvesIds)
  validateShelfOwnership(userId, shelves)
  await updateItemsShelves(action, shelvesIds, userId, itemsIds)
  // todo: make it fast: create a param which explicits if shelves are needed
  return getShelvesByIdsWithItems(shelvesIds, userId)
}

const assignItemsToShelves = (shelves: Shelf[], items: Item[]) => shelves.map(assignItemsToShelf(items))

const assignItemsToShelf = items => shelf => {
  shelf.items = shelf.items || []
  const itemsIds = items.map(property('_id'))
  const missingItems = difference(itemsIds, shelf.items)
  shelf.items = shelf.items.concat(missingItems)
  return shelf as ShelfWithItems
}
