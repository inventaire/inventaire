const listings_ = require('controllers/listings/lib/listings')
const error_ = require('lib/error/error')

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }) => {
  const listing = await listings_.getListingWithSelections(id, uris, reqUserId)
  if (!listing) throw error_.notFound({ id })
  listings_.validateOwnership(reqUserId, listing)
  return listings_.addSelections({ listing, uris, userId: reqUserId })
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'addSelections' ]
}
