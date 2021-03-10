const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')

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
