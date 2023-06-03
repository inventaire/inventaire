import { map } from 'lodash-es'
import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import Element from '#models/element'

const db = await dbFactory('elements')

const elements_ = {
  byId: db.get,
  byIds: db.byIds,
  byEntities: async uris => db.viewByKeys('byEntities', uris),
  byListingsAndEntity: async (listingsIds, entitiesUris) => {
    const keys = _.combinations(listingsIds, entitiesUris)
    return db.viewByKeys('byListAndEntity', keys)
  },
  byListings: async listingsIds => db.viewByKeys('byListings', listingsIds),
  bulkDelete: db.bulkDelete,
  deleteListingsElements: async listings => {
    const listingIds = map(listings, '_id')
    const listingsElements = await elements_.byListings(listingIds)
    if (_.isNonEmptyArray(listingsElements)) {
      await elements_.bulkDelete(listingsElements)
    }
    return listingsElements
  },
  create: async ({ listing, uris, userId }) => {
    const listingId = listing._id
    if (listing.creator !== userId) {
      throw error_.new('wrong user', 403, { userId, listingId })
    }
    const elements = uris.map(uri => Element.create({
      list: listingId,
      uri,
    }))
    const res = await db.bulk(elements)
    const elementsIds = _.map(res, 'id')
    return db.fetch(elementsIds)
  },
}

export default elements_
