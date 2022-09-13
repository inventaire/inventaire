const _ = require('builders/utils')
const listings_ = require('controllers/listings/lib/listings')
const selections_ = require('controllers/listings/lib/selections')

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listingsRes = await listings_.byIdsWithSelections(ids, reqUserId)
  const listings = _.compact(listingsRes)
  listings_.validateOwnership(reqUserId, listings)
  const deletedSelections = await selections_.deleteListingsSelections(listings)
  await listings_.bulkDelete(listings)
  return {
    ok: true,
    lists: listings,
    selections: deletedSelections,
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'deletion' ]
}
