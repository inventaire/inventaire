const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const Shelf = __.require('models', 'shelf')
const items_ = __.require('controllers', 'items/lib/items')
const getAuthorizedItems = __.require('controllers', 'items/lib/get_authorized_items')
const db = __.require('couch', 'base')('shelves')
const error_ = __.require('lib', 'error/error')
const { tap } = __.require('lib', 'promises')

const shelves_ = module.exports = {
  create: async params => {
    const { description, listing, name, reqUserId } = params
    const newShelf = { owner: reqUserId, description, listing, name }
    const shelf = Shelf.create(newShelf)
    return db.postAndReturn(shelf)
  },
  byId: db.get,
  byIds: db.fetch,
  byIdsWithItems: async (ids, reqUserId) => {
    const shelves = await shelves_.byIds(ids)
    const shelvesCount = _.compact(shelves).length
    if (shelvesCount === 0) { return [] }
    if (shelvesCount === 1) { return byShelfWithItems(shelves[0], reqUserId) }
    const items = await getAuthorizedItems.byShelves(shelves, reqUserId)
    assignItemsToShelves(shelves, items)
  },
  byOwners: ownersIds => {
    return db.viewByKeys('byOwners', ownersIds)
  },
  updateAttributes: (params, shelfId) => {
    const { reqUserId } = params
    const newAttributes = _.pick(params, [ 'name', 'description', 'listing' ])
    return db.get(shelfId)
    .then(tap(() => shelves_.validateOwnership(reqUserId)))
    .then(Shelf.updateAttributes(reqUserId, newAttributes))
    .then(db.putAndReturn)
  },
  addItems: (ids, itemsIds, userId) => {
    return updateShelvesItems('addShelves', ids, userId, itemsIds)
  },
  removeItems: (ids, itemsIds, userId) => {
    return updateShelvesItems('deleteShelves', ids, userId, itemsIds)
  },
  bulkDelete: db.bulkDelete,
  deleteShelvesItems: shelves => {
    const itemsIds = _.uniq(_.flatten(shelves.map(_.property('items'))))
    return items_.byIds(itemsIds)
    .then(_.compact)
    .then(items_.bulkDelete)
  },
  validateOwnership: (userId, shelves) => {
    shelves = _.forceArray(shelves)
    for (const shelf of shelves) {
      if (shelf.owner !== userId) {
        throw error_.new('wrong owner', 403, { userId, shelfId: shelf._id })
      }
    }
  }
}

const updateShelvesItems = async (action, shelvesIds, userId, itemsIds) => {
  const shelves = await shelves_.byIds(shelvesIds)
  shelves_.validateOwnership(userId, shelves)
  await items_.updateShelves(action, shelvesIds, userId, itemsIds)
  return shelves_.byIdsWithItems(shelvesIds, userId)
}

const assignItemsToShelves = (shelves, items) => {
  return shelves.map(assignItemsToShelf(items))
}

const assignItemsToShelf = items => shelf => {
  if (!shelf.items) { shelf.items = [] }
  const itemsIds = items.map(_.property('_id'))
  const missingItems = _.difference(itemsIds, shelf.items)
  shelf.items = shelf.items.concat(missingItems)
}

const byShelfWithItems = async (shelf, reqUserId) => {
  const items = await getAuthorizedItems.byShelf(shelf, reqUserId)
  assignItemsToShelf(items)(shelf)
  return [ shelf ]
}
