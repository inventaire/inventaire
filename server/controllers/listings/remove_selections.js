const _ = require('builders/utils')
const listings_ = require('controllers/listings/lib/listings')
const { filterFoundSelectionsUris } = require('controllers/listings/lib/helpers')
const error_ = require('lib/error/error')
const selections_ = require('controllers/listings/lib/selections')
const { addWarning } = require('lib/responses')

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }, req, res) => {
  const listing = await listings_.getListingWithSelections(id, reqUserId)
  if (!listing) throw error_.notFound({ id })

  listings_.validateOwnership(reqUserId, listing)

  const { foundSelections: selectionsToDelete, notFoundUris } = filterFoundSelectionsUris(listing.selections, uris)
  if (selectionsToDelete.length === 0) {
    throw error_.notFound({ uris })
  }
  await selections_.bulkDelete(selectionsToDelete)
  if (_.isNonEmptyArray(notFoundUris)) {
    addWarning(res, `entities uris not found in list: ${notFoundUris.join(', ')}`)
  }
  return { list: listing }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'deleteSelection' ]
}
