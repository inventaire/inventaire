import { compact } from 'lodash-es'
import { bulkDeleteShelves, deleteShelvesItems, getShelvesByIdsWithItems, validateShelfOwnership } from '#controllers/shelves/lib/shelves'

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean',
  },
}

const controller = async ({ ids, reqUserId, withItems }) => {
  const shelvesRes = await getShelvesByIdsWithItems(ids, reqUserId)
  const shelves = compact(shelvesRes)
  validateShelfOwnership(reqUserId, shelves)
  const res = { shelves }
  if (withItems) {
    const deletedItems = await deleteShelvesItems(shelves)
    res.items = deletedItems
  }
  await bulkDeleteShelves(shelves)
  res.ok = true
  return res
}

export default { sanitization, controller }
