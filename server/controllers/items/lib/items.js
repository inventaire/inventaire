const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Item = __.require('models', 'item')
const listingsPossibilities = Item.attributes.constrained.listing.possibilities
const assert_ = __.require('utils', 'assert_types')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const promises_ = __.require('lib', 'promises')
const radio = __.require('lib', 'radio')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const { maxKey } = __.require('lib', 'couch')
const listingsLists = require('./listings_lists')
const snapshot_ = require('./snapshot/snapshot')
const getByAccessLevel = require('./get_by_access_level')
const user_ = __.require('controllers', 'user/lib/user')
const db = __.require('couch', 'base')('items')
const validateEntityType = require('./validate_entity_type')

const items_ = module.exports = {
  byId: db.get,
  byIds: db.fetch,
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
    .map(snapshot_.addToItem)
    .map(filterPrivateAttributes(reqUserId))
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
    .map(snapshot_.addToItem)
    .map(filterPrivateAttributes(reqUserId))
  },

  create: (userId, items) => {
    assert_.array(items)
    return promises_.all(items.map(validateEntityType))
    .map(item => Item.create(userId, item))
    .then(db.bulk)
    .then(res => {
      const itemsIds = _.map(res, 'id')
      return db.fetch(itemsIds)
      .tap(() => radio.emit('user:inventory:update', userId))
    })
  },

  update: (userId, itemUpdateData) => {
    return db.get(itemUpdateData._id)
    .then(currentItem => Item.update(userId, itemUpdateData, currentItem))
    .then(db.putAndReturn)
    .tap(() => radio.emit('user:inventory:update', userId))
  },

  bulkUpdate: (userId, ids, attribute, newValue) => {
    const itemUpdateData = {}
    itemUpdateData[attribute] = newValue
    return items_.byIds(ids)
    .map(currentItem => Item.update(userId, itemUpdateData, currentItem))
    .then(db.bulk)
    .tap(() => radio.emit('user:inventory:update', userId))
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
      return promises_.all([
        user_.getUsersByIds(usersIds, reqUserId),
        getByAccessLevel.public(usersIds)
      ])
    }
  },

  // Data manipulation done on client-side view models (item.serializeData),
  // but useful to have server-side for emails view models
  serializeData: item => {
    return snapshot_.addToItem(item)
    .then(item => {
      const { 'entity:title': title, 'entity:authors': authors, 'entity:image': image } = item.snapshot
      item.title = title
      item.authors = authors
      if (image != null) { item.pictures = [ image ] }
      return item
    })
  }
}

const listingByEntities = (listing, uris, reqUserId) => {
  const keys = uris.map(uri => [ uri, listing ])
  return db.viewByKeys('byEntity', keys)
  .map(filterPrivateAttributes(reqUserId))
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
