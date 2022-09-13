const _ = require('builders/utils')
const listings_ = require('controllers/listings/lib/listings')
const elements_ = require('controllers/listings/lib/elements')

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

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'deletion' ]
}
