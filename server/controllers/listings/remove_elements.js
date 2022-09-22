const _ = require('builders/utils')
const listings_ = require('controllers/listings/lib/listings')
const { filterFoundElementsUris } = require('controllers/listings/lib/helpers')
const error_ = require('lib/error/error')
const elements_ = require('controllers/listings/lib/elements')
const { addWarning } = require('lib/responses')

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }, req, res) => {
  const listing = await listings_.getListingWithElements(id, reqUserId)
  if (!listing) throw error_.notFound({ id })

  listings_.validateOwnership(reqUserId, listing)

  const { foundElements: elementsToDelete, notFoundUris } = filterFoundElementsUris(listing.elements, uris)
  if (elementsToDelete.length === 0) {
    throw error_.notFound({ uris })
  }
  await elements_.bulkDelete(elementsToDelete)
  if (_.isNonEmptyArray(notFoundUris)) {
    addWarning(res, `entities uris not found in list: ${notFoundUris.join(', ')}`)
  }
  return { list: listing }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'deleteElement' ]
}
