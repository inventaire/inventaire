const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const Shelf = __.require('models', 'shelf')
const items_ = __.require('controllers', 'items/lib/items')
const getAuthorizedItems = __.require('controllers', 'items/lib/get_authorized_items')
const db = __.require('couch', 'base')('shelves')
const error_ = __.require('lib', 'error/error')

const shelves_ = module.exports = {
  create: async newShelf => {
    const shelf = Shelf.create(newShelf)
    return db.postAndReturn(shelf)
  },
  byId: db.get,
  byIds: db.byIds,
  byIdsWithItems: async (ids, reqUserId) => {
    const shelves = await shelves_.byIds(ids)
    const shelvesCount = _.compact(shelves).length
    if (shelvesCount === 0) return []
    const items = await getAuthorizedItems.byShelves(shelves, reqUserId)
    return assignItemsToShelves(shelves, items)
  },
  byOwners: ownersIds => {
    return db.viewByKeys('byOwners', ownersIds)
  },
  updateAttributes: async params => {
    const { shelfId, reqUserId } = params
    const newAttributes = _.pick(params, [ 'name', 'description', 'listing' ])
    const shelf = await db.get(shelfId)
    const updatedShelf = Shelf.updateAttributes(shelf, newAttributes, reqUserId)
    return db.putAndReturn(updatedShelf)
  },
  addItems: (ids, itemsIds, userId) => {
    return updateShelvesItems('addShelves', ids, userId, itemsIds)
  },
  removeItems: (ids, itemsIds, userId) => {
    return updateShelvesItems('deleteShelves', ids, userId, itemsIds)
  },
  bulkDelete: db.bulkDelete,
  deleteShelvesItems: async shelves => {
    const itemsIds = _.uniq(_.flatten(shelves.map(_.property('items'))))
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
    return db.viewByKeys('byOwners', [ userId ])
    .then(db.bulkDelete)
  },
}

const updateShelvesItems = async (action, shelvesIds, userId, itemsIds) => {
  const shelves = await shelves_.byIds(shelvesIds)
  shelves_.validateOwnership(userId, shelves)
  await items_.updateShelves(action, shelvesIds, userId, itemsIds)
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
