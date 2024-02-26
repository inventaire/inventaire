import { compact, difference, flatMap, map, pick, property, uniq } from 'lodash-es'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getAuthorizedItemsByShelves } from '#controllers/items/lib/get_authorized_items'
import { getItemsByIds, itemsBulkDelete, updateItemsShelves } from '#controllers/items/lib/items'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import { emit } from '#lib/radio'
import { forceArray } from '#lib/utils/base'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import shelfAttributes from '#models/attributes/shelf'
import Shelf from '#models/shelf'

const { updatable } = shelfAttributes

const db = await dbFactory('shelves')

export const createShelf = async newShelf => {
  const shelf = Shelf.create(newShelf)
  await validateVisibilityKeys(shelf.visibility, shelf.owner)
  return db.postAndReturn(shelf)
}

export const getShelfById = db.get

export const getShelvesByIds = db.byIds

export const getShelvesByIdsWithItems = async (ids, reqUserId) => {
  const shelves = await getShelvesByIds(ids)
  const shelvesCount = compact(shelves).length
  if (shelvesCount === 0) return []
  let items = await getAuthorizedItemsByShelves(shelves, reqUserId)
  items = items.map(filterPrivateAttributes(reqUserId))
  return assignItemsToShelves(shelves, items)
}

export const getShelvesByOwners = ownersIds => {
  return db.viewByKeys('byOwner', ownersIds)
}

export const updateShelfAttributes = async params => {
  const { shelfId, reqUserId } = params
  const newAttributes = pick(params, updatable)
  if (newAttributes.visibility) {
    await validateVisibilityKeys(newAttributes.visibility, reqUserId)
  }
  const shelf = await db.get(shelfId)
  const updatedShelf = Shelf.updateAttributes(shelf, newAttributes, reqUserId)
  return db.putAndReturn(updatedShelf)
}

export const addItemsToShelves = async (shelvesIds, itemsIds, userId) => {
  const docs = await updateShelvesItems('addShelves', shelvesIds, userId, itemsIds)
  await emit('shelves:update', shelvesIds)
  return docs
}

export const removeItemsFromShelves = (shelvesIds, itemsIds, userId) => {
  return updateShelvesItems('deleteShelves', shelvesIds, userId, itemsIds)
}

export const bulkDeleteShelves = async shelves => {
  if (shelves.length === 0) return
  await db.bulkDelete(shelves)
  const reqUserId = shelves[0].owner
  const shelvesIds = map(shelves, '_id')
  const shelvesItems = await getAuthorizedItemsByShelves(shelves, reqUserId)
  const itemsIds = map(shelvesItems, '_id')
  await updateItemsShelves('deleteShelves', shelvesIds, reqUserId, itemsIds)
}

export const deleteShelvesItems = async shelves => {
  const itemsIds = uniq(flatMap(shelves, 'items'))
  const docs = await getItemsByIds(itemsIds).then(compact)
  await itemsBulkDelete(docs)
  return docs
}

export const validateShelfOwnership = (userId, shelves) => {
  shelves = forceArray(shelves)
  for (const shelf of shelves) {
    if (shelf.owner !== userId) {
      throw error_.new('wrong owner', 403, { userId, shelfId: shelf._id })
    }
  }
}

export const deleteUserShelves = userId => {
  return db.viewByKeys('byOwner', [ userId ])
  .then(db.bulkDelete)
}

const updateShelvesItems = async (action, shelvesIds, userId, itemsIds) => {
  const shelves = await getShelvesByIds(shelvesIds)
  validateShelfOwnership(userId, shelves)
  await updateItemsShelves(action, shelvesIds, userId, itemsIds)
  // todo: make it fast: create a param which explicits if shelves are needed
  return getShelvesByIdsWithItems(shelvesIds, userId)
}

const assignItemsToShelves = (shelves, items) => shelves.map(assignItemsToShelf(items))

const assignItemsToShelf = items => shelf => {
  shelf.items = shelf.items || []
  const itemsIds = items.map(property('_id'))
  const missingItems = difference(itemsIds, shelf.items)
  shelf.items = shelf.items.concat(missingItems)
  return shelf
}
