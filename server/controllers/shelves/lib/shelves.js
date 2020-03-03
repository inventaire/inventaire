const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const Shelf = __.require('models', 'shelf')
const items_ = __.require('controllers', 'items/lib/items')
const db = __.require('couch', 'base')('shelves')
const itemDb = __.require('couch', 'base')('items')
const error_ = __.require('lib', 'error/error')
const { tap } = __.require('lib', 'promises')

const shelves_ = module.exports = {
  create: params => {
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
  updateAttributes: (params, oldShelfId) => {
    const { reqUserId } = params
    const newAttributes = _.pick(params, [ 'name', 'description', 'listing' ])
    return db.get(oldShelfId)
    .then(tap(() => validateOwnership(reqUserId)))
    .then(Shelf.updateAttributes(reqUserId, newAttributes))
    .then(db.putAndReturn)
  },
  addItems: (ids, itemsIds, userId) => {
    return shelves_.byIds(ids)
    .then(items_.addShelves(itemsIds, userId))
    .then(() => {
      return shelves_.byIdsWithItems(ids)
    })
  },
  bulkDelete: db.bulkDelete,
  deleteItems: (ids, itemsIds, userId) => {
    return shelves_.byIds(ids)
    .then(items_.deleteShelves(itemsIds, userId))
    .then(() => {
      return shelves_.byIdsWithItems(ids)
    })
  },
  deleteShelvesItems: shelves => {
    const itemsIds = _.uniq(_.flatten(shelves.map(_.property('items'))))
    return items_.byIds(itemsIds)
    .then(_.compact)
    .then(items_.bulkDelete)
  }
}

const validateOwnership = reqUserId => shelf => {
  if (shelf.owner !== reqUserId) {
    throw error_.new('wrong owner', 400, shelf.owner)
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
  const itemsIdsContainingShelves = items.filter(item => {
    return item.shelves && item.shelves.includes(shelfId)
  })
  .map(_.property('_id'))
  if (!shelf.items) { shelf.items = [] }
  shelf.items = _.uniq(shelf.items.concat(itemsIdsContainingShelves))
  return shelf
}
