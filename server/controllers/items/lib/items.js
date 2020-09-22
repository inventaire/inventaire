const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const Item = __.require('models', 'item')
const listingsPossibilities = Item.attributes.constrained.listing.possibilities
const assert_ = __.require('utils', 'assert_types')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const { tapEmit, emit } = __.require('lib', 'radio')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const { maxKey } = __.require('lib', 'couch')
const listingsLists = require('./listings_lists')
const snapshot_ = require('./snapshot/snapshot')
const getByAccessLevel = require('./get_by_access_level')
const user_ = __.require('controllers', 'user/lib/user')
const db = __.require('couch', 'base')('items')
const error_ = __.require('lib', 'error/error')
const validateEntityAndShelves = require('./validate_entity_and_shelves')

const items_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byOwner: ownerId => {
    return db.viewCustom('byOwnerAndEntityAndListing', {
      startkey: [ ownerId ],
      endkey: [ ownerId, maxKey, maxKey ],
      include_docs: true
    })
  },

  byEntity: entityUri => {
    assert_.string(entityUri)
    return db.viewByKeys('byEntity', entityUriKeys(entityUri))
  },

  byPreviousEntity: entityUri => db.viewByKey('byPreviousEntity', entityUri),

  byShelvesAndListing: (keys, reqUserId) => {
    return db.viewByKeys('byShelvesAndListing', keys)
    .then(formatItems(reqUserId))
  },

  // all items from an entity that require a specific authorization
  authorizedByEntities: (uris, reqUserId) => {
    return listingByEntities('network', uris, reqUserId)
  },

  publicByEntities: (uris, reqUserId) => {
    return listingByEntities('public', uris, reqUserId)
  },

  publicByDate: (limit = 15, offset = 0, assertImage = false, reqUserId) => {
    return db.viewCustom('publicByDate', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    })
    .then(filterWithImage(assertImage))
    .then(formatItems(reqUserId))
  },

  byOwnersAndEntitiesAndListings: (ownersIds, uris, listingsKey, reqUserId) => {
    const keys = []
    for (const ownerId of ownersIds) {
      for (const uri of uris) {
        for (const listing of listingsLists[listingsKey]) {
          keys.push([ ownerId, uri, listing ])
        }
      }
    }

    return db.viewByKeys('byOwnerAndEntityAndListing', keys)
    .then(formatItems(reqUserId))
  },

  create: async (userId, items) => {
    assert_.array(items)
    await Promise.all(items.map(validateEntityAndShelves(userId)))
    items = items.map(item => Item.create(userId, item))
    const res = await db.bulk(items)
    const itemsIds = _.map(res, 'id')
    const { docs } = await db.fetch(itemsIds)
    emit('user:inventory:update', userId)
    return docs
  },

  update: (userId, itemUpdateData) => {
    return Promise.resolve(validateEntityAndShelves(userId)(itemUpdateData))
    .then(() => { return db.get(itemUpdateData._id) })
    .then(currentItem => Item.update(userId, itemUpdateData, currentItem))
    .then(db.putAndReturn)
    .then(tapEmit('user:inventory:update', userId))
  },

  bulkUpdate: ({ reqUserId, ids, attribute, newValue }) => {
    const itemUpdateData = {}
    itemUpdateData[attribute] = newValue
    return items_.byIds(ids)
    .then(promises_.map(currentItem => Item.update(reqUserId, itemUpdateData, currentItem)))
    .then(db.bulk)
    .then(tapEmit('user:inventory:update', reqUserId))
  },

  setBusyness: (id, busy) => {
    assert_.string(id)
    assert_.boolean(busy)
    return db.update(id, BasicUpdater('busy', busy))
  },

  changeOwner: transacDoc => {
    const { item } = transacDoc
    return db.get(item)
    .then(Item.changeOwner.bind(null, transacDoc))
    .then(db.postAndReturn)
  },

  bulkDelete: db.bulkDelete,

  nearby: (reqUserId, range = 50, strict = false) => {
    return user_.nearby(reqUserId, range, strict)
    .then(items_.getUsersAndItemsPublicData(reqUserId))
  },

  getUsersAndItemsPublicData: reqUserId => {
    return usersIds => {
      _.log(usersIds, 'usersIds')
      if (usersIds.length <= 0) return [ [], [] ]
      return Promise.all([
        user_.getUsersByIds(usersIds, reqUserId),
        getByAccessLevel.public(usersIds)
      ])
    }
  },

  // Data serializa emails and rss feeds templates
  serializeData: item => {
    return snapshot_.addToItem(item)
    .then(item => {
      const { 'entity:title': title, 'entity:authors': authors, 'entity:image': image } = item.snapshot
      item.title = title
      item.authors = authors
      if (image != null) { item.pictures = [ image ] }
      return item
    })
  },

  updateShelves: async (action, shelvesIds, userId, itemsIds) => {
    const items = await items_.byIds(itemsIds)
    validateOwnership(userId, items)
    const updatedItems = items.map(item => {
      item.shelves = actionFunctions[action](item.shelves, shelvesIds)
      return item
    })
    return db.bulk(updatedItems)
  }
}

const validateOwnership = (userId, items) => {
  items = _.forceArray(items)
  for (const item of items) {
    if (item.owner !== userId) {
      throw error_.new('wrong owner', 400, { userId, itemId: item._id })
    }
  }
}

const formatItems = reqUserId => async items => {
  items = await Promise.all(items.map(snapshot_.addToItem))
  return items.map(filterPrivateAttributes(reqUserId))
}

const listingByEntities = async (listing, uris, reqUserId) => {
  const keys = uris.map(uri => [ uri, listing ])
  const items = await db.viewByKeys('byEntity', keys)
  return items.map(filterPrivateAttributes(reqUserId))
}

const entityUriKeys = entityUri => listingsPossibilities.map(listing => [ entityUri, listing ])

const filterWithImage = assertImage => items => {
  return Promise.all(items.map(snapshot_.addToItem))
  .then(items => {
    if (assertImage) return items.filter(itemWithImage)
    else return items
  })
}

const itemWithImage = item => item.snapshot['entity:image']

const actionFunctions = {
  addShelves: _.union,
  deleteShelves: _.difference
}
