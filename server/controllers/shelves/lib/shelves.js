import _ from '#builders/utils'
import Shelf from '#models/shelf'
import items_ from '#controllers/items/lib/items'
import getAuthorizedItems from '#controllers/items/lib/get_authorized_items'
import dbFactory from '#db/couchdb/base'
import error_ from '#lib/error/error'
import { emit } from '#lib/radio'
import { updatable as updateAttributes } from '#models/attributes/shelf'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'

const db = dbFactory('shelves')

const shelves_ = {
  create: async newShelf => {
    const shelf = Shelf.create(newShelf)
    await validateVisibilityKeys(shelf.visibility, shelf.owner)
    return db.postAndReturn(shelf)
  },
  byId: db.get,
  byIds: db.byIds,
  byIdsWithItems: async (ids, reqUserId) => {
    const shelves = await shelves_.byIds(ids)
    const shelvesCount = _.compact(shelves).length
    if (shelvesCount === 0) return []
    let items = await getAuthorizedItems.byShelves(shelves, reqUserId)
    items = items.map(filterPrivateAttributes(reqUserId))
    return assignItemsToShelves(shelves, items)
  },
  byOwners: ownersIds => {
    return db.viewByKeys('byOwner', ownersIds)
  },
  updateAttributes: async params => {
    const { shelfId, reqUserId } = params
    const newAttributes = _.pick(params, updateAttributes)
    if (newAttributes.visibility) {
      await validateVisibilityKeys(newAttributes.visibility, reqUserId)
    }
    const shelf = await db.get(shelfId)
    const updatedShelf = Shelf.updateAttributes(shelf, newAttributes, reqUserId)
    return db.putAndReturn(updatedShelf)
  },
  addItems: async (ids, itemsIds, userId) => {
    const docs = await updateShelvesItems('addShelves', ids, userId, itemsIds)
    await emit('shelves:update', ids)
    return docs
  },
  removeItems: (ids, itemsIds, userId) => {
    return updateShelvesItems('deleteShelves', ids, userId, itemsIds)
  },
  bulkDelete: db.bulkDelete,
  deleteShelvesItems: async shelves => {
    const itemsIds = _.uniq(_.flatMap(shelves, 'items'))
    const docs = await items_.byIds(itemsIds).then(_.compact)
    await items_.bulkDelete(docs)
    return docs
  },
  validateOwnership: (userId, shelves) => {
    shelves = _.forceArray(shelves)
    for (const shelf of shelves) {
      if (shelf.owner !== userId) {
        throw error_.new('wrong owner', 403, { userId, shelfId: shelf._id })
      }
    }
  },
  deleteUserShelves: userId => {
    return db.viewByKeys('byOwner', [ userId ])
    .then(db.bulkDelete)
  },
}

export default shelves_

const updateShelvesItems = async (action, shelvesIds, userId, itemsIds) => {
  const shelves = await shelves_.byIds(shelvesIds)
  shelves_.validateOwnership(userId, shelves)
  await items_.updateShelves(action, shelvesIds, userId, itemsIds)
  // todo: make it fast: create a param which explicits if shelves are needed
  return shelves_.byIdsWithItems(shelvesIds, userId)
}

const assignItemsToShelves = (shelves, items) => shelves.map(assignItemsToShelf(items))

const assignItemsToShelf = items => shelf => {
  shelf.items = shelf.items || []
  const itemsIds = items.map(_.property('_id'))
  const missingItems = _.difference(itemsIds, shelf.items)
  shelf.items = shelf.items.concat(missingItems)
  return shelf
}
