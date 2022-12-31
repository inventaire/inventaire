import _ from 'builders/utils'
import listings_ from 'controllers/listings/lib/listings'
import elements_ from 'controllers/listings/lib/elements'

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listingsRes = await listings_.byIdsWithElements(ids, reqUserId)
  const listings = _.compact(listingsRes)
  listings_.validateOwnership(reqUserId, listings)
  const deletedElements = await elements_.deleteListingsElements(listings)
  await listings_.bulkDelete(listings)
  return {
    ok: true,
    lists: listings,
    elements: deletedElements,
  }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'deletion' ]
}
