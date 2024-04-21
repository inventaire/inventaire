import { difference, keyBy, map } from 'lodash-es'
import { filterPrivateAttributes } from '#controllers/shelves/lib/filter_private_attributes'
import { getShelvesByIds, getShelvesByIdsWithItems } from '#controllers/shelves/lib/shelves'
import { notFoundError, unauthorizedError } from '#lib/error/error'
import { addWarning } from '#lib/responses'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { Shelf, ShelfId } from '#types/shelf'

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean',
  },
}

async function controller ({ ids, withItems, reqUserId }, req, res) {
  const getShelves = withItems ? getShelvesByIdsWithItems : getShelvesByIds
  const foundShelves = await getShelves(ids, reqUserId)
  const foundShelvesIds: ShelfId[] = map(foundShelves, '_id')
  checkNotFoundShelves(ids, foundShelves, foundShelvesIds, res)
  let authorizedShelves = await filterVisibleDocs(foundShelves, reqUserId)
  checkUnauthorizedShelves(authorizedShelves, foundShelvesIds, req, res)
  authorizedShelves = authorizedShelves.map(filterPrivateAttributes(reqUserId))
  const shelves: Record<ShelfId, Shelf> = keyBy(authorizedShelves, '_id')
  return { shelves }
}

function checkNotFoundShelves (ids, foundShelves, foundShelvesIds, res) {
  if (foundShelves.length === 0) throw notFoundError({ ids })
  if (foundShelves.length !== ids.length) {
    const notFoundShelvesIds = difference(ids, foundShelvesIds)
    addWarning(res, `shelves not found: ${notFoundShelvesIds.join(', ')}`)
  }
}

function checkUnauthorizedShelves (authorizedShelves, foundShelvesIds, req, res) {
  if (authorizedShelves.length === 0) {
    throw unauthorizedError(req, 'unauthorized shelves access', { ids: foundShelvesIds })
  }
  if (authorizedShelves.length !== foundShelvesIds.length) {
    const authorizedShelvesIds = map(authorizedShelves, '_id')
    const unauthorizedShelvesIds = difference(foundShelvesIds, authorizedShelvesIds)
    addWarning(res, `unauthorized shelves access: ${unauthorizedShelvesIds.join(', ')}`)
  }
}

export default { sanitization, controller }

export type ShelvesByIdsResponse = Awaited<ReturnType<typeof controller>>
