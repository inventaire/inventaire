import { bulkDeleteElements } from '#controllers/listings/lib/elements'
import { filterFoundElementsUris } from '#controllers/listings/lib/helpers'
import { getListingWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { addWarning } from '#lib/responses'

const sanitization = {
  id: {},
  uris: {},
}

const controller = async ({ id, uris, reqUserId }, req, res) => {
  const listing = await getListingWithElements(id, reqUserId)
  if (!listing) throw error_.notFound({ id })

  validateListingOwnership(reqUserId, listing)

  const { foundElements: elementsToDelete, notFoundUris } = filterFoundElementsUris(listing.elements, uris)
  if (elementsToDelete.length === 0) {
    throw error_.notFound({ uris })
  }
  await bulkDeleteElements(elementsToDelete)
  if (isNonEmptyArray(notFoundUris)) {
    addWarning(res, `entities uris not found in list: ${notFoundUris.join(', ')}`)
  }
  return { list: listing }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'deleteElement' ],
}
