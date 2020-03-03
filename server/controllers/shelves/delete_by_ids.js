const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { tap } = __.require('lib', 'promises')

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
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const deleteByIds = params => {
  const { ids, reqUserId, withItems } = params
  return shelves_.byIdsWithItems(ids)
  .then(_.compact)
  .then(tap(validateDeletion(withItems)))
  .then(tap(validateOwnership(reqUserId)))
  .then(tap(deleteShelfItems(withItems)))
  .then(shelves_.bulkDelete)
}

const deleteShelfItems = withItems => shelves => {
  if (withItems) { shelves_.deleteShelvesItems(shelves) }
}

const validateOwnership = reqUserId => shelves => {
  for (const shelf of shelves) {
    if (shelf.owner !== reqUserId) {
      throw error_.new("user isn't shelf owner", 403, { reqUserId, shelfId: shelf._id })
    }
  }
}

const validateDeletion = withItems => shelves => {
  if (withItems) { return }
  for (const shelf of shelves) {
    if (shelf.items.length > 0) {
      throw error_.new('shelf cannot be deleted. Delete items first or pass a with-items parameter', 403, { shelf })
    }
  }
}
