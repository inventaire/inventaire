const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(deleteByIds)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const deleteByIds = async params => {
  const { ids, reqUserId, withItems } = params
  const shelvesRes = await shelves_.byIdsWithItems(ids, reqUserId)
  const shelves = _.compact(shelvesRes)
  validateDeletion(withItems, shelves)
  shelves_.validateOwnership(reqUserId, shelves)
  const res = { shelves }
  if (withItems) {
    const deletedItems = await shelves_.deleteShelvesItems(shelves)
    res.items = deletedItems
  }
  await shelves_.bulkDelete(shelves)
  return res
}

const validateDeletion = (withItems, shelves) => {
  if (withItems) return
  for (const shelf of shelves) {
    if (shelf.items.length > 0) {
      throw error_.new('shelf cannot be deleted. Delete items first or pass a with-items parameter', 403, { shelf })
    }
  }
}
