import _ from '#builders/utils'
import shelves_ from '#controllers/shelves/lib/shelves'

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

const controller = async ({ ids, reqUserId, withItems }) => {
  const shelvesRes = await shelves_.byIdsWithItems(ids, reqUserId)
  const shelves = _.compact(shelvesRes)
  shelves_.validateOwnership(reqUserId, shelves)
  const res = { shelves }
  if (withItems) {
    const deletedItems = await shelves_.deleteShelvesItems(shelves)
    res.items = deletedItems
  }
  await shelves_.bulkDelete(shelves)
  res.ok = true
  return res
}

export default { sanitization, controller }
