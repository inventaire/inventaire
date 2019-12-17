const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
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
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const deleteByIds = params => {
  const { ids, reqUserId, withItems } = params
  return bookshelves_.byIdsWithItems(ids)
  .then(_.compact)
  .tap(validateDeletion(withItems))
  .tap(validateOwnership(reqUserId))
  .tap(bookshelves => { if (withItems) { bookshelves_.deleteBookshelvesItems(bookshelves) } })
  .then(bookshelves_.bulkDelete)
}

const validateOwnership = reqUserId => bookshelves => {
  for (const bookshelf of bookshelves) {
    if (bookshelf.owner !== reqUserId) {
      throw error_.new("user isn't bookshelf owner", 403, { reqUserId, bookshelfId: bookshelf._id })
    }
  }
}

const validateDeletion = withItems => bookshelves => {
  if (withItems) { return }
  for (const bookshelf of bookshelves) {
    if (bookshelf.items.length > 0) {
      throw error_.new('bookshelf cannot be deleted. Delete items first or pass a with items parameter', 403, { bookshelf })
    }
  }
}
