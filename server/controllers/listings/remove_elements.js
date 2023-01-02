import _ from '#builders/utils'
import listings_ from '#controllers/listings/lib/listings'
import { filterFoundElementsUris } from '#controllers/listings/lib/helpers'
import error_ from '#lib/error/error'
import elements_ from '#controllers/listings/lib/elements'
import { addWarning } from '#lib/responses'

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

export default {
  sanitization,
  controller,
  track: [ 'lists', 'deleteElement' ]
}
