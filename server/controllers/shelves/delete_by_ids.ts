import { compact } from 'lodash-es'
import { bulkDeleteShelves, deleteShelvesItems, getShelvesByIdsWithItems, validateShelfOwnership } from '#controllers/shelves/lib/shelves'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean',
  },
} as const

async function controller ({ ids, reqUserId, withItems }: SanitizedParameters) {
  const shelvesRes = await getShelvesByIdsWithItems(ids, reqUserId)
  const shelves = compact(shelvesRes)
  validateShelfOwnership(reqUserId, shelves)
  let res
  if (withItems) {
    const deletedItems = await deleteShelvesItems(shelves)
    res = {
      ok: true,
      shelves,
      items: deletedItems,
    }
  } else {
    res = {
      ok: true,
      shelves,
    }
  }
  await bulkDeleteShelves(shelves)
  return res
}

export default { sanitization, controller }
