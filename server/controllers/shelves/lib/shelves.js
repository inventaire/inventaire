const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const Shelf = __.require('models', 'shelf')
const items_ = __.require('controllers', 'items/lib/items')
const db = __.require('couch', 'base')('shelves')
const itemDb = __.require('couch', 'base')('items')
const error_ = __.require('lib', 'error/error')
const { tap } = __.require('lib', 'promises')

const shelves_ = module.exports = {
  create: async params => {
    const { description, listing, name, reqUserId } = params
    const newShelf = { owner: reqUserId, description, listing, name }
    const shelf = Shelf.create(newShelf)
    return db.postAndReturn(shelf)
  },
  byIds: db.fetch,
  byIdsWithItems: ids => {
    return Promise.all([ shelves_.byIds(ids), fetchItems(ids) ])
    .then(assignItemsToShelves)
  },
  byOwners: ownersIds => {
    return db.viewByKeys('byOwners', ownersIds)
  },
  byOwnersWithItems: ownersIds => {
    return shelves_.byOwners(ownersIds)
    .then(shelves => {
      const ids = _.values(shelves).map(_.property('_id'))
      return shelves_.byIdsWithItems(ids)
    })
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
    return shelves_.byIds(ids)
    .then(tap(shelves_.validateOwnership(userId)))
    .then(items_.addShelves(itemsIds, userId))
    .then(() => {
      return shelves_.byIdsWithItems(ids)
    })
  },
  removeItems: (ids, itemsIds, userId) => {
    return shelves_.byIds(ids)
    .then(tap(shelves_.validateOwnership(userId)))
    .then(items_.deleteShelves(itemsIds, userId))
    .then(() => {
      return shelves_.byIdsWithItems(ids)
    })
  },
  bulkDelete: db.bulkDelete,
  deleteShelvesItems: shelves => {
    const itemsIds = _.uniq(_.flatten(shelves.map(_.property('items'))))
    return items_.byIds(itemsIds)
    .then(_.compact)
    .then(items_.bulkDelete)
  },
  validateOwnership: userId => shelves => {
    _.forceArray(shelves)
    for (const shelf of shelves) {
      if (shelf.owner !== userId) {
        throw error_.new("user isn't shelf owner", 403, { userId, shelfId: shelf._id })
      }
    }
  }
}

const fetchItems = shelvesIds => {
  return itemDb.viewByKeys('byShelves', shelvesIds)
}

const assignItemsToShelves = ([ shelves, items ]) => {
  return shelves.map(assignItemsToShelf(items))
}

const assignItemsToShelf = items => shelf => {
  const shelfId = shelf._id
  const shelfItemsIds = items.filter(isInShelf(shelfId))
  .map(_.property('_id'))
  if (!shelf.items) { shelf.items = [] }
  shelf.items = _.uniq(shelf.items.concat(shelfItemsIds))
  return shelf
}

const isInShelf = shelfId => item => {
  return item.shelves && item.shelves.includes(shelfId)
}
